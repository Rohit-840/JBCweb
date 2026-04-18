from fastapi import WebSocket
import asyncio

async def trade_ws(websocket: WebSocket):
    await websocket.accept()
    
    while True:
        data = {
            "symbol": "EURUSD",
            "price": 1.2345
        }
        
        await websocket.send_json(data)
        await asyncio.sleep(1)