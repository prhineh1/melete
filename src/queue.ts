type QueueNode = {
  val: string;
  next: QueueNode | null;
};

export default class Queue {
  private head: QueueNode | null;
  private tail: QueueNode | null;
  public length: number;

  constructor() {
    this.head = this.tail = null;
    this.length = 0;
  }

  enqueue(val: string) {
    const node = { val, next: null };
    if (!this.tail) {
      this.head = this.tail = node;
    } else {
      const tail = this.tail;
      this.tail = node;
      tail.next = node;
    }

    this.length++;
  }

  deque(): string | null {
    if (!this.head) {
      return null;
    }

    const head = this.head;
    this.head = this.head.next;
    head.next = null;
    this.length--;

    if (!this.length) {
      this.head = this.tail = null;
    }

    return head.val;
  }
}
