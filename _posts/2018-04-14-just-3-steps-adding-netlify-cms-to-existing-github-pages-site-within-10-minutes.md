---
title: >-
  Just 3 Steps: Adding Netlify CMS to Existing GitHub Pages Site Within 10
  Minutes
author: Cnly
date: '2018-04-14T20:16:42+08:00'
tags:
  - this
  - tutorial
---
**Updated 14 July 2019**: Added the requirement of adding a custom domain according to [this](https://github.com/netlify/netlify-cms/issues/770#issuecomment-482293908) comment.

**Updated 19 April 2019**: Updated `admin/index.html` to the latest official version and fixed some minor (natural) language problems.

This post walks through the really fast process of adding [Netlify CMS](https://www.netlifycms.org/) to an existing GitHub Pages site. At the end of this post you should have:

* A functioning CMS for your static GitHub Pages site
* Your GitHub Pages site **still hosted by GitHub Pages, not Netlify**
* Logging into the CMS through GitHub OAuth, with Netlify auth servers (not git-gateway)

Let's get started.

<br>

## Creating an GitHub OAuth App

First, go to [GitHub Dev Settings](https://github.com/settings/developers) and click **New OAuth App**. Or just click here: <https://github.com/settings/developers>

Enter whatever you like for **Application name** and **Homepage URL**.

In **Authorization callback URL**, enter: `https://api.netlify.com/auth/done`.

Once finished, leave the page in the background. You will need the **Client ID** and **Client Secret** on this page later.

<br>

## Creating a Netlify Site

... Relax! We're just creating one, without actually using it. In fact, if you want to deploy Jekyll site on Netlify, you [will need](https://www.netlify.com/blog/2015/10/28/a-step-by-step-guide-jekyll-3.0-on-netlify/) to include Jekyll (generator) in your git repo.

Go to [Netlify](https://app.netlify.com/account/sites) and create a new site from... _any_ repo. We are not really using Netlify to host that, anyway.

After that, go to **Settings**, and copy your **Site name**. It should be something like `octopus-cat-123456`.

From the sidebar go to **Domain Management** and add your GitHub Pages domain (`you.github.io`) as a custom domain. Choose **Yes** when asked if you are `github.io`'s owner.

From the sidebar go to **Access control**, scroll down to **OAuth** and click **Install provider**.

Choose **GitHub** as provider, and enter the **Client ID** and **Client Secret** from GitHub OAuth app page mentioned above.

Then you can close the Netlify and GitHub webpages.

<br>

## "Installing" the CMS

Finally! We are now going to add the CMS files into our static Jekyll site.

Under the root directory of your site, create a folder named `admin`, and `cd` into it. All our work will be done here.

Create a file named `index.html`.

Copy and paste these into it:

```html
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Content Manager</title>
</head>
<body>
  <!-- Include the script that builds the page and powers Netlify CMS -->
  <script src="https://unpkg.com/netlify-cms@^2.0.0/dist/netlify-cms.js"></script>
</body>
</html>
```

Then create another file named `config.yml`.

Copy and paste these into it:

```yaml
backend:
  name: github
  repo: you/you.github.io
  branch: master
  site_domain: octopus-cat-123456.netlify.com

media_folder: "images/uploads"

collections:
  - name: "blog" # Used in routes, e.g., /admin/collections/blog
    label: "Blog" # Used in the UI
    folder: "_posts/" # The path to the folder where the documents are stored
    create: true # Allow users to create new documents in this collection
    slug: "{{ "{{year" }}}}-{{ "{{month" }}}}-{{ "{{day" }}}}-{{ "{{slug" }}}}" # Filename template, e.g., YYYY-MM-DD-title.md
    fields: # The fields for each document, usually in front matter
      - {label: "Title", name: "title", widget: "string"}
      - {label: "Publish Date", name: "date", widget: "datetime"}
      - {label: "Tags", name: "tags", widget: "list"}
      - {label: "Body", name: "body", widget: "markdown"}
```

Be sure to replace `you/you.github.io` with your repo, and `octopus-cat-123456.netlify.com` with `your-site-name.netlify.com`.

For more information about the `fields` field, please go to <https://www.netlifycms.org/docs/add-to-your-site/#collections>.

Save the files, commit, and push to GitHub. Done. Visit `https://you.github.io/admin` to see your CMS. :D

<br>

## References

* <https://www.netlifycms.org/docs/add-to-your-site/#collections>
* <https://www.netlifycms.org/docs/widgets/>
* <https://www.netlifycms.org/docs/authentication-backends/#github-backend>
* <https://www.netlify.com/docs/authentication-providers/#using-an-authentication-provider>
* <https://test-drive-test--netlify-cms-www.netlify.com/docs/custom-authentication/>
