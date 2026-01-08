import uuid

# 配置
COUNT = 50          # 生成多少个
PLAN = 'monthly'    # 类型
# PLAN = 'yearly' 

print(f"-- 请把以下 SQL 语句复制到 Supabase SQL Editor 运行 --")
print("INSERT INTO redemption_codes (code, plan_type) VALUES")

codes_for_mbd = []

for i in range(COUNT):
    # 生成 VIP-XXXX-XXXX 格式
    code = f"VIP-{str(uuid.uuid4())[:8].upper()}"
    codes_for_mbd.append(code)
    
    # SQL 格式
    end_char = "," if i < COUNT - 1 else ";"
    print(f"('{code}', '{PLAN}'){end_char}")

print("\n" + "="*30)
print("👇 下面是给面包多导入的纯文本 (复制这些去面包多后台) 👇")
print("="*30)
for c in codes_for_mbd:
    print(c)
