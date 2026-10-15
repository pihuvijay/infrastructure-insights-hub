The journey

 
   flowchart TD
     A["1. Frontend component (browser, port 3000)"] -->
   B["2. src/lib/api.ts sends the HTTP request"]
   
     B -->|"network: GET http://localhost:8000/health"| 
   C["3. backend/app/main.py: app receives it"]
     C --> D["4. backend/app/api/health.py: route matche
   s /health"]
     D --> E["5. backend/app/services/health.py: does th
   e real work"]
     E --> F["6. Postgres and Redis answer"]
     F --> G["7. Response goes back up the same chain as
   JSON"]
 

 Step by step with the code

 1. Frontend component. A status indicator asks for the
 health and shows green or red.


 
   const { data } = useQuery({ queryKey: ["health"], que
   ryFn: api.health });
   // shows green if data.postgres === "ok"
 

 2.  src/lib/api.ts . The only file that talks to the
 network. A new line is added:


 
   health: () => http("/health"),
 

 This runs  fetch("http://localhost:8000/health") . The
 request is now travelling over the network.

 3.  backend/app/main.py . The backend is already
 running. This file created the app and registered the
 route file:


 
   from fastapi import FastAPI
   from app.api import health
 
   app = FastAPI()
   app.include_router(health.router)
 

  main.py  receives the request and finds the route that
 matches.

 4.  backend/app/api/health.py . The route. It matches
 the method and path, then calls the service:


 
   from fastapi import APIRouter
   from app.services import health as health_service
 
   router = APIRouter()
 
   @router.get("/health")
   def health():
       return health_service.check()
 

 It contains no logic, only the match and the hand-off.

 5.  backend/app/services/health.py . The real work:


 
   def check():
       return {"postgres": ping_postgres(), "redis": pin
   g_redis()}
 

 Those two helpers send  SELECT 1  to Postgres and  PING
  to Redis, using the connection settings read from  .en
 v .

 6. Postgres and Redis each answer, then the result
 returns:


 
   {"postgres": "ok", "redis": "ok"}
 

 7. Back up the chain. The service returns the
 dictionary to the route, FastAPI turns it into JSON,
 the response travels back over the network to  api.ts ,
 and the component turns green.

 Summary table

 ┌───────┬─────────────────────┬───────────────────────┐
 │ Order │ File                │ Job                   │
 ├───────┼─────────────────────┼───────────────────────┤
 │ 1     │ Component           │ Asks for data and     │
 │       │                     │ shows it              │
 ├───────┼─────────────────────┼───────────────────────┤
 │ 2     │  api.ts             │ Sends the HTTP        │
 │       │                     │ request               │
 ├───────┼─────────────────────┼───────────────────────┤
 │ 3     │  main.py            │ Receives it and finds │
 │       │                     │ the route             │
 ├───────┼─────────────────────┼───────────────────────┤
 │ 4     │  api/health.py      │ Matches  /health  and │
 │       │                     │ calls the service     │
 ├───────┼─────────────────────┼───────────────────────┤
 │ 5     │  services/health.py │ Checks Postgres and   │
 │       │                     │ Redis                 │
 └───────┴─────────────────────┴───────────────────────┘

 For step 1.3 we only build steps 3 to 6. Steps 1 and 2
 come in step 1.5, and for now you'll test it with  curl
  or the browser. Does that make the whole path clear?
 If so, say "go ahead".