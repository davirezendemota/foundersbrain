# WebSocket example (opcional)
# from fastapi import WebSocket, WebSocketDisconnect
# from fastapi import APIRouter
# 
# ws_router = APIRouter()
# 
# @ws_router.websocket("/ws")
# async def websocket_endpoint(websocket: WebSocket):
#     await websocket.accept()
#     try:
#         while True:
#             data = await websocket.receive_text()
#             await websocket.send_text(f"Message text was: {data}")
#     except WebSocketDisconnect:
#         pass

