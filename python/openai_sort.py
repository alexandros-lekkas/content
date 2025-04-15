import openai

def gpt_sort(arr):
    prompt = f"Sort this list in ascending order: {arr}"

    response = openai.ChatCompletion.create(
        model="gpt-4", # use reasoning model for more efficiency
        messages=[
            {"role": "system", "content": "You are a helpful sorting assistant. Do not yap, just return the array in the format given to you by the prompt."},
            {"role": "user", "content": prompt},
        ]
    )

    reply = response['choices'][0]['message']['content']
    print(reply)

    try:
        sorted_arr = eval(reply)
        return sorted_arr
    except Exception as e:
        print(f"Error evaluating the response: {e}")
        return None
    
unsorted_arr = [3, 4, 1, 2, 5]
sorted_arr = gpt_sort(unsorted_arr)
print(f"Sorted array: {sorted_arr}")
