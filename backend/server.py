from fastapi import FastAPI, Request
from fastapi.responses import Response
import httpx
import os

app = FastAPI()

NEXT_URL = "http://127.0.0.1:3000"

@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"])
async def proxy_to_next(request: Request, path: str):
    target_url = f"{NEXT_URL}/{path}"
    
    headers = dict(request.headers)
    headers.pop("host", None)
    headers.pop("Host", None)
    
    body = await request.body()
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.request(
                method=request.method,
                url=target_url,
                headers=headers,
                content=body,
                params=dict(request.query_params),
                follow_redirects=False,
            )
        
        resp_headers = dict(response.headers)
        resp_headers.pop("transfer-encoding", None)
        resp_headers.pop("content-encoding", None)
        resp_headers.pop("content-length", None)
        
        return Response(
            content=response.content,
            status_code=response.status_code,
            headers=resp_headers,
        )
    except httpx.ConnectError:
        return Response(content=b'{"error":"Next.js server not ready"}', status_code=503, media_type="application/json")
    except Exception as e:
        return Response(content=f'{{"error":"{str(e)}"}}'.encode(), status_code=502, media_type="application/json")
