from datetime import datetime, timedelta

def calculate_review(quality: int, prev_easiness: float, prev_interval: int, prev_reps: int):
    """
    quality: 0(忘记) ~ 5(完全认识)
    返回: (new_easiness, new_interval, new_reps, next_review_date)
    """
    # 1. 如果忘记 (quality < 3)，重置进度
    if quality < 3:
        return max(1.3, prev_easiness), 1, 0, datetime.utcnow() + timedelta(days=1)

    # 2. 计算新的难度系数 (Easiness Factor)
    # 公式：EF' = EF + (0.1 - (5-q) * (0.08 + (5-q)*0.02))
    new_easiness = prev_easiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    new_easiness = max(1.3, new_easiness) # 最小不低于 1.3

    # 3. 计算新的间隔 (Interval)
    if prev_reps == 0:
        new_interval = 1
    elif prev_reps == 1:
        new_interval = 6
    else:
        new_interval = int(prev_interval * new_easiness)

    # 4. 计算下次复习日期
    next_date = datetime.utcnow() + timedelta(days=new_interval)

    return new_easiness, new_interval, prev_reps + 1, next_date
