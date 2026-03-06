/**
 * PriorityQueue.js
 * 
 * Implements a Max-Priority Queue using a Binary Heap.
 * Used for scheduling patients based on Severity and Arrival Time.
 * 
 * Time Complexity:
 * - Insertion: O(log n)
 * - Deletion (Extract Max): O(log n)
 * - Peek: O(1)
 * 
 * Space Complexity: O(n)
 */

class PriorityQueue {
    constructor() {
        this.heap = [];
    }

    // Helper to get parent index
    getParentIndex(i) {
        return Math.floor((i - 1) / 2);
    }

    // Helper to get left child index
    getLeftChildIndex(i) {
        return 2 * i + 1;
    }

    // Helper to get right child index
    getRightChildIndex(i) {
        return 2 * i + 2;
    }

    // Swap two elements
    swap(i, j) {
        [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
    }

    /**
     * Compare two patients to determine priority.
     * Returns true if patient1 has higher priority than patient2.
     * 
     * Priority Logic:
     * 1. Severity Score: Higher wins (Critical > High > Medium > Low)
     * 2. Arrival Time: Lower (Earlier) wins if severity is equal
     */
    isHigherPriority(patient1, patient2) {
        if (patient1.severityScore > patient2.severityScore) {
            return true;
        } else if (patient1.severityScore < patient2.severityScore) {
            return false;
        } else {
            // Severity is equal, check arrival time (FCFS)
            return patient1.arrivalTime < patient2.arrivalTime;
        }
    }

    /**
     * Insert a new patient into the queue.
     * Time Complexity: O(log n) because of bubbleUp
     */
    enqueue(patient) {
        this.heap.push(patient);
        this.bubbleUp();
    }

    bubbleUp() {
        let index = this.heap.length - 1;
        while (index > 0) {
            let parentIndex = this.getParentIndex(index);
            if (this.isHigherPriority(this.heap[index], this.heap[parentIndex])) {
                this.swap(index, parentIndex);
                index = parentIndex;
            } else {
                break;
            }
        }
    }

    /**
     * Remove and return the highest priority patient.
     * Time Complexity: O(log n) because of bubbleDown
     */
    dequeue() {
        if (this.heap.length === 0) return null;
        if (this.heap.length === 1) return this.heap.pop();

        const max = this.heap[0];
        this.heap[0] = this.heap.pop();
        this.bubbleDown();
        return max;
    }

    bubbleDown() {
        let index = 0;
        while (this.getLeftChildIndex(index) < this.heap.length) {
            let leftChildIndex = this.getLeftChildIndex(index);
            let rightChildIndex = this.getRightChildIndex(index);
            let largerChildIndex = leftChildIndex;

            if (rightChildIndex < this.heap.length && 
                this.isHigherPriority(this.heap[rightChildIndex], this.heap[leftChildIndex])) {
                largerChildIndex = rightChildIndex;
            }

            if (this.isHigherPriority(this.heap[largerChildIndex], this.heap[index])) {
                this.swap(index, largerChildIndex);
                index = largerChildIndex;
            } else {
                break;
            }
        }
    }

    /**
     * View the highest priority patient without removing.
     * Time Complexity: O(1)
     */
    peek() {
        return this.heap.length > 0 ? this.heap[0] : null;
    }

    /**
     * Get all elements (sorted copy for visualization).
     * This is O(n log n) due to sorting, used for display only.
     * The internal heap remains O(n) structure.
     */
    toArray() {
        // Return a copy sorted by priority for the dashboard list view
        // Note: The heap array itself is not fully sorted, so we sort a copy
        return [...this.heap].sort((a, b) => {
            if (this.isHigherPriority(a, b)) return -1;
            return 1;
        });
    }

    isEmpty() {
        return this.heap.length === 0;
    }
    
    size() {
        return this.heap.length;
    }
}

module.exports = PriorityQueue;
