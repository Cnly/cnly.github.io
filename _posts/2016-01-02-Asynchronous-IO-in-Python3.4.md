---
title: Python 3.4中的异步I/O
tags: default
---
## 异步I/O与线程：异步I/O ≠ 多线程

如果一项操作在不需要CPU工作的情况下就可以完成，那么这项操作就可以在不开新线程的情况下完成。

I/O操作便是如此。当有一项I/O操作时，CPU仅需开始这项操作，然后即可以继续进行其它动作。在此期间，I/O硬件会执行相应的I/O操作。当I/O操作完成时，硬件会中断CPU，然后由OS把事件送达你的应用程序。

<br />

## Select

`select`是Unix中的一个system call。它可以检查打开的输入/输出通道的文件描述符的状态。但目前已被相似但性能更好的`epoll`、`kqueue`等system call代替。

Python中的`selectors.DefaultSelector`会使用最适合当前系统的一种select函数。

<br />

## Generator

一般来讲，程序的栈帧（stack frame）是在栈中分配的。但是Python的栈帧是在堆中分配的。于是，Python栈帧的生命周期可以超越函数调用。

生成器正是利用了这一特性。如果一个函数含有`yield`关键字，那么它就是生成器。当调用这个函数时，它不会像普通函数一样执行，而是返回一个`generator`对象：

{% highlight python %}
def gen_fn():
    yield 1

>>> type(gen_fn())
<class 'generator'>
{% endhighlight %}

### yield 与 yield from

`yield`关键字就像`return`，但是专门为生成器设计的。生成器通过`yield`，可以返回一个结果，并把控制权转交给调用者。

`yield from`关键字可以允许一个生成器委托（delegate）另一个生成器。被委托的生成器在return前，`yield from`就像一个管道。它将yield的内容向调用者传递，并将send的内容向子生成器传递。当子生成器return，`yield from`会收到子生成器return的对象。

### 实例解释生成器

{% highlight python %}
>>> def gen_fn():
...     result = yield 1
...     print('result of yield: {}'.format(result))
...     result2 = yield 2
...     print('result of 2nd yield: {}'.format(result2))
...     return 'done'
...     

gen = gen_fn()  # 获得生成器对象

>>> gen.send(None)  # 使生成器开始运行，直到其yield
1  # send会返回yield的对象

>>> gen.send('hello')  # 把hello设置成yield的对象，并使生成器从断点继续运行
result of yield: hello  ＃ 可见生成器函数内的result的值为hello
2  # 返回第二次yield的对象

>>> gen.send('goodbye')
result of 2nd yield: goodbye
Traceback (most recent call last):
  File "<input>", line 1, in <module>
StopIteration: done  # 生成器return时会抛出StopIteration错误，且该错误的参数是return的对象

>>> def caller_fn():
...     gen = gen_fn()
...     rv = yield from gen
...     print('return value of yield-from: {}'
...           .format(rv))
...

>>> caller = caller_fn()
>>> caller.send(None)  # gen_fn中yield的内容由caller_fn的yield from传递给调用者
1
>>> caller.gi_frame.f_lasti  ＃ 最后一条指令的位置
15
>>> caller.send('hello')
result of yield: hello  # send的内容由caller_fn的yield from传递给gen_fn
2
>>> caller.gi_frame.f_lasti  # 可以看出caller_fn没有前进
15
>>> caller.send('goodbye')
result of 2nd yield: goodbye
return value of yield-from: done  # yield from得到gen_fn的return的结果
Traceback (most recent call last):
  File "<input>", line 1, in <module>
StopIteration  # caller_fn结束
{% endhighlight %}

<br />

## Coroutine

Coroutine是一种可以在特定点挂起、恢复的子程序（subroutine）。

在Python中，coroutine由生成器实现。当coroutine需要挂起时，可以`yield`一个对象；当外部调用者调用`send`时，coroutine便被恢复。

Python中还有一个标识coroutine的decorator: `@asyncio.coroutine`。但是它并不决定一个函数是否是coroutine。

<br />

## 异步I/O

### Event Loop

`EventLoop`负责等待事件（如进行select），并将事件通知给coroutine注册的callback。

### Future

`Future`对象代表一个coroutine在等待的结果。下面是一个简略版本：

{% highlight python %}
class Future:
    def __init__(self):
        self.result = None
        self._callbacks = []

    def add_done_callback(self, fn):
        self._callbacks.append(fn)

    def set_result(self, result):
        self.result = result
        for fn in self._callbacks:
            fn(self)
{% endhighlight %}

### Task

`Task`对象用于驱动生成器。简略版本：

{% highlight python %}
class Task:
    def __init__(self, coro):
        self.coro = coro
        f = Future()
        f.set_result(None)
        self.step(f)

    def step(self, future):
        try:
            next_future = self.coro.send(future.result)
        except StopIteration:
            return

        next_future.add_done_callback(self.step)
{% endhighlight %}

### 基本流程

0. 用Task对coroutine进行包装；Task调用send，使coroutine开始运行
0. coroutine动作，向EventLoop或selector注册callback，yield一个Future
0. Task收到Future，在Future上添加自己的done_callback
0. coroutine等待EventLoop或selector调用事件的callback
0. coroutine收到callback，将Future的result设置成I/O的结果（即解决该Future）
0. Future被解决，Task在其上注册的done_callback被调用，Task继续对coroutine调用send
0. 从第二步继续，直到coroutine结束

<br />

## References

* [language agnostic - Asynchronous vs Multithreading - Is there a difference? - Stack Overflow](http://stackoverflow.com/questions/600795/asynchronous-vs-multithreading-is-there-a-difference)
* [500lines/crawler.markdown at master · aosabook/500lines](https://github.com/aosabook/500lines/blob/master/crawler/crawler.markdown)
* [select (Unix) - Wikipedia, the free encyclopedia](https://en.wikipedia.org/wiki/Select_(Unix))
* [Coroutine - Wikipedia, the free encyclopedia](https://en.wikipedia.org/wiki/Coroutine)
