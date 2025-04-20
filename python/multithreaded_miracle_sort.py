import time
import threading

def is_sorted(arr):
    """Check if the array is sorted."""
    return all(arr[i] <= arr[i + 1] for i in range(len(arr) - 1))

def miracle_prayer(arr, found_event, thread_id, counter):
    while not found_event.is_set():
        print(f"🧵 Thread {thread_id}: 🤲 Still waiting for a miracle (Attempt {counter[thread_id]})")
        time.sleep(0.1)
        counter[thread_id] += 1

        if is_sorted(arr):
            found_event.set()
            print(f"🧵 Thread {thread_id}: 🎉 Miracle! The array is sorted!")
            break

def miracle_sort(arr, num_threads=5):
    print("🙏 Initializing multithreaded miracle sort")

    found_event = threading.Event()
    counters = {i: 0 for i in range(num_threads)}

    threads = []
    for i in range(num_threads):
        thread = threading.Thread(target=miracle_prayer, args=(arr, found_event, i, counters))
        thread.start()
        threads.append(thread)

    for t in threads:
        t.join()

    print("Miracle sort completed! 🔮")

unsorted_array = [3, 2, 4, 1, 5]
print("Unsorted array:", unsorted_array)
sorted_list = miracle_sort(unsorted_array.copy())
print("Sorted array:", sorted_list)
    