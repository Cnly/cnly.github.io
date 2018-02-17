---
title: Revisiting Golang (Early 2018)
tags: [golang]
---

Last time I saw [dep](https://github.com/golang/dep), it was still marked as 'under development' and 'not for production.' Recently I revisited dep's repo, and I found that it has become 'safe for production use.' Then I knew some changes might have been brought to the language ecosystem. And I decided to give some thoughts to the language (ecosystem included) again.

I remember that in the past, Golang has made me feel somewhat strange in some aspects in terms of its ecosystem.

Let's first look at the most common **forking workflow** on, say, GitHub. You fork `foouser/foorepo` to `you/foorepo`. And you clone your fork to local. And then? You find that your local repo are full of import errors. This is because `foouser` uses import paths like `github.com/foouser/foorepo`, but by running `git clone https://github.com/you/foorepo`, your local project path becomes `you/foorepo`. This just makes me feel _annoyed_.

But this does not mean forking is dead. A way to deal with this issue is [cloning the original repo](https://stackoverflow.com/questions/14323872/using-forked-package-import-in-go). But this just leaves me with another problem: how should I preserve the original repo and the fork at the same time? I would probably need to use different `$GOPATH` then. And in order not to specify `$GOPATH` all the times, I may need to get something like virtualenv involved... But why can't I just have two repos... _simply_ and _elegantly_? Hmmm...

Another ecosystem problem for Golang is with its **dependency management**. dep is 'the official _experiment_, but not yet the official tool ([GitHub](https://github.com/golang/dep#dep)).' Anyway, this is a good thing. Before dep, there were quite a few unofficial dependency management tools, which did not have an agreed standard. Some quick facts: Node.js was initially released in 2009 and Golang 2012. NPM's initial _release_ was in 2010. dep's first _commit_ was in 2016.

Now we can move on to the language itself.

When I first started with Golang, I was pretty unaccustomed to the language. I was thinking that there was no way that I could deal with data highly dynamic with few lines of code. For example, in Python, I can do:

{% highlight python %}
obj = json.loads('somestring')
print(obj['somekey'])
{% endhighlight %}

which is very flexible and convenient, especially when prototyping. But after thinking about this again, I realised that this may just be one of the most significant differences between **static typing** and dynamic typing languages. I might have been spoiled by Python, a dynamic typing language, for too long. Dynamic typing saves my time coding, but it results in poorer runtime performance. And while fewer lines of code may be one kind of elegance, faster execution may just be _another_ as well.

There have also been enough discussions on Golang's lack of **generic**. But personally, I think this may not be a big problem for me. Most of the functionalities I need can be implemented without generic, and there are also interfaces in Golang, if necessary. Additionally, there are also tools like [genny](https://github.com/cheekybits/genny).

So after re-considering the language, I think Golang is still worth learning and using. :)

