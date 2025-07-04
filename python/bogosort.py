import random

def is_sorted(arr):
    """Check if the array is sorted."""
    return all(arr[i] <= arr[i + 1] for i in range(len(arr) - 1))

def bogosort(arr):
    attempts = 0
    """Sort the array using the Bogosort algorithm."""
    while not is_sorted(arr):
        random.shuffle(arr)
        print(f"Attempt {attempts + 1}: {arr}")
        attempts += 1

    print(f"Total attempts: {attempts}")
    return arr

array = [3, 2, 1, 4, 5, 20, 10]
sorted_array = bogosort(array)
