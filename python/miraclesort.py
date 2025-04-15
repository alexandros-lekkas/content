import time

def is_sorted(arr):
    return all(arr[i] <= arr[i + 1] for i in range(len(arr) - 1))

def miracle_sort(arr):
    print("🙏 Initializing miracle")

    attempts = 0

    while not is_sorted(arr):
        print("🤲 Still waiting for a miracle")
        time.sleep(0.1) # Miracle's dont happen THAT often
        attempts += 1

    print("🎉 Miracle happened after {} attempts!".format(attempts))

    return arr

unsorted_list = [5, 3, 8, 6, 2, 7, 4, 1]
print("🔮 Sorting the list with miracle sort")
miracle_sort(unsorted_list)