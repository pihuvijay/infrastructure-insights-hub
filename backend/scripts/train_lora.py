"""LoRA fine-tune. Runs on a laptop CPU (small model) or an NVIDIA GPU (QLoRA, Llama 3.1 8B).

Install:  pip install "transformers>=4.44" peft trl datasets accelerate torch
          (GPU only: pip install bitsandbytes)
Data:     JSONL, one object per line: {"prompt": "...", "response": "..."}

CPU (laptop):  python train_lora.py --data rcas.jsonl --out ./lora-rca --merge
GPU:           python train_lora.py --data rcas.jsonl --out ./lora-rca
Override base: --model meta-llama/Llama-3.2-1B-Instruct   (needs HF login + licence)

CPU output: with --merge, ./lora-rca/merged is a full model you can import into Ollama.
GPU serve:  vllm serve meta-llama/Llama-3.1-8B-Instruct --enable-lora \
                --lora-modules rca=./lora-rca --max-lora-rank 16
"""

import argparse

import torch
from datasets import load_dataset
from peft import LoraConfig
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from trl import SFTConfig, SFTTrainer

GPU_MODEL = "meta-llama/Llama-3.1-8B-Instruct"
CPU_MODEL = "Qwen/Qwen2.5-0.5B-Instruct"


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--data", required=True)
    p.add_argument("--out", default="./lora-rca")
    p.add_argument("--model")
    p.add_argument("--cpu", action="store_true", help="force CPU even if a GPU exists")
    p.add_argument("--merge", action="store_true", help="also save adapter merged into the base model")
    p.add_argument("--epochs", type=int, default=3)
    p.add_argument("--lr", type=float, default=2e-4)
    p.add_argument("--rank", type=int, default=16)
    p.add_argument("--max-len", type=int, default=1024)
    a = p.parse_args()

    gpu = torch.cuda.is_available() and not a.cpu
    base = a.model or (GPU_MODEL if gpu else CPU_MODEL)
    print(f"device={'cuda' if gpu else 'cpu'} model={base}")

    tok = AutoTokenizer.from_pretrained(base)
    tok.pad_token = tok.pad_token or tok.eos_token

    if gpu:
        bf16 = torch.cuda.is_bf16_supported()
        model = AutoModelForCausalLM.from_pretrained(
            base,
            quantization_config=BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_quant_type="nf4",
                bnb_4bit_compute_dtype=torch.bfloat16 if bf16 else torch.float16,
            ),
            device_map="auto",
        )
    else:
        bf16 = False
        model = AutoModelForCausalLM.from_pretrained(base, torch_dtype=torch.float32)

    def to_text(row: dict) -> dict:
        msgs = [{"role": "user", "content": row["prompt"]}, {"role": "assistant", "content": row["response"]}]
        return {"text": tok.apply_chat_template(msgs, tokenize=False)}

    ds = load_dataset("json", data_files=a.data, split="train").map(to_text, remove_columns=["prompt", "response"])
    split = ds.train_test_split(test_size=0.1, seed=42)

    trainer = SFTTrainer(
        model=model,
        processing_class=tok,
        train_dataset=split["train"],
        eval_dataset=split["test"],
        peft_config=LoraConfig(
            r=a.rank,
            lora_alpha=2 * a.rank,
            lora_dropout=0.05,
            target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
            task_type="CAUSAL_LM",
        ),
        args=SFTConfig(
            output_dir=a.out,
            num_train_epochs=a.epochs,
            learning_rate=a.lr,
            per_device_train_batch_size=1,
            gradient_accumulation_steps=8,
            gradient_checkpointing=gpu,
            logging_steps=5,
            eval_strategy="epoch",
            save_strategy="epoch",
            use_cpu=not gpu,
            bf16=bf16,
            fp16=gpu and not bf16,
            max_length=a.max_len,
            dataset_text_field="text",
            report_to="none",
        ),
    )
    trainer.train()
    trainer.model.save_pretrained(a.out)
    tok.save_pretrained(a.out)

    if a.merge:
        merged = trainer.model.merge_and_unload()
        merged.save_pretrained(f"{a.out}/merged")
        tok.save_pretrained(f"{a.out}/merged")
        print(f"merged model saved to {a.out}/merged")


if __name__ == "__main__":
    main()
