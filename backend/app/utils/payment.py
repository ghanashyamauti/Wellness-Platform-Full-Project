import random

def process_payment(amount: int):
    # Randomly return success or failure
    if random.choice([True, False]):
        return "SUCCESS"
    return "FAILED"
