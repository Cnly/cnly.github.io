---
title: 一个小团队的 git 协作方案和 Workflow
tags: [default]
---



我们从Fork and Pull模式切换到了Shared Repository模式。其中的主要原因是前者对于小团队来说有些臃肿，给我们带来了一些不太好看的git history。

在Shared Repository模式中，所有成员共享一个中心repo，并且所有成员拥有写权限。项目的history看起来大概会像这样：

![Overall History](https://imgur.com/TI5Hp0s.png)

上图中`master`是主分支，只应该出现稳定的版本，`develop`是开发分支，`feat-1`等从`develop`上分支出来的（此处只有一条）是feature分支。如果在merge之后删除`feat-1`分支，那么history看起来会是：

![Overall History with feat-1 Deleted](https://imgur.com/keQli2c.png)

我比较喜欢这种分支视图，因为它可以完整地保留每个feature branch的历史。删除分支后不能直接从分支名看出一条feature分支曾经的作用，可以通过查看merge commit的commit message解决。

## Workflow

1. 成员clone repo，做好相关准备
2. 成员pull远端`develop`分支，然后checkout新的feature branch，进行开发
3. 成员发起pull request，申请将feature分支上的commits merge到`develop`分支上。
4. 对PR进行review，然后用**`--no-ff`**的方式进行merge（**为了正确保留历史**）
5. Feature分支被merge后，成员将本地分支用`git branch -d`删除，并用`git push -d <remote> <branch>`将远端对应的分支删除
6. `develop`分支上的代码稳定后，考虑merge到master


## References

- [Collaborative Models in GitHub](http://www.goring.org/resources/project-management.html)
- [A successful Git branching model » nvie.com](http://nvie.com/posts/a-successful-git-branching-model/)