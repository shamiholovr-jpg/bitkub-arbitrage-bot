# bitkub-arbitrage-bot для Render.com (24/7)
import requests
import time
import asyncio
from datetime import datetime
import telegram
import os

# === НАСТРОЙКИ (из ENV) ===
TOKEN = os.getenv('TELEGRAM_TOKEN', "8322231327:AAEdqm3BxfJtipFj5cTZ1ok90fZdfJhqjIo")
CHAT_ID = int(os.getenv('CHAT_ID', 688364440))

bot = telegram.Bot(token=TOKEN)

BITKUB_API = "https://api.bitkub.com/api/market/ticker"

async def send_alert(pair, bitkub_price, binance_price, diff):
    base = pair.split('/')[0]
    text = (
        f"*АРБИТРАЖ НА BITKUB!*\n\n"
        f"`{pair}`\n"
        f"Bitkub: *{bitkub_price:,.4f}* USDT\n"
        f"Binance: *{binance_price:,.4f}* USDT\n"
        f"Разница: *{diff:+.3f}%* (после комиссий)\n"
        f"`{datetime.now().strftime('%H:%M:%S')}`\n\n"
        f"[Bitkub](https://www.bitkub.com/trade/{pair.replace('/', '_')}) | [Binance](https://www.binance.com/en/trade/{base}_USDT)"
    )
    try:
        await bot.send_message(
            chat_id=CHAT_ID,
            text=text,
            parse_mode='Markdown',
            disable_web_page_preview=True
        )
        print(f"АЛЕРТ ОТПРАВЛЕН: {pair} → {diff:+.3f}%")
    except Exception as e:
        print(f"Ошибка отправки: {e}")

def fetch_bitkub():
    try:
        r = requests.get(BITKUB_API, timeout=10)
        return r.json()
    except Exception as e:
        print(f"Ошибка Bitkub: {e}")
        return {}

def main():
    print("Бот запущен на Render! 24/7 арбитраж...")
    while True:
        try:
            data = fetch_bitkub()
            usdt_thb = data.get('THB_USDT', {}).get('last')
            if not usdt_thb:
                print("THB_USDT недоступна")
                time.sleep(60)
                continue

            print(f"[{datetime.now().strftime('%H:%M:%S')}] USDT/THB = {usdt_thb:.4f}")

            for pair_thb, ticker in data.items():
                if not pair_thb.endswith('_THB') or pair_thb == 'THB_USDT':
                    continue
                if ticker.get('quoteVolume', 0) < 100000:
                    continue

                base = pair_thb.replace('_THB', '')
                xxx_thb = ticker['last']
                synthetic_usdt = xxx_thb / usdt_thb

                # Binance цена (прямой API)
                binance_url = f"https://api.binance.com/api/v3/ticker/price?symbol={base}USDT"
                try:
                    b_response = requests.get(binance_url, timeout=10).json()
                    binance_price = float(b_response['price'])
                except:
                    continue

                diff = ((synthetic_usdt - binance_price) / binance_price) * 100 - 0.5

                if abs(diff) > 0.3:
                    print(f"АРБИТРАЖ НАЙДЕН: {base}/THB → {diff:+.3f}%")
                    asyncio.run(send_alert(f"{base}/THB", synthetic_usdt, binance_price, diff))

            print("Проверка завершена. Жду 60 сек...")
            time.sleep(60)

        except Exception as e:
            print(f"Ошибка цикла: {e}")
            time.sleep(60)

if __name__ == "__main__":
    main()
