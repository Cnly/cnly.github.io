---
title: 'Exploring AWS Lambda: How Serverless Works + a Serverless Hello World IP Echo App'
tags: [aws, serverless]
---

Actually there's an official Hello World [document](https://docs.aws.amazon.com/lambda/latest/dg/get-started-create-function.html). But I'm not satisfied with the explanations provided for the AWS terms in it. So I wrote this, to bring the Hello World further, with more basic explanations (in the simplest words) to AWS services.

In this post, we will create a Lambda that echos the IP of the client.

Before getting started, let's first look at what resources we have.

As a new user on AWS, one recieves **12 months free** and **always free** products. For details, see [here](https://aws.amazon.com/free/).

In order to build our Hello World App and make it publicly accessible through internet, we will need **Lambda** and **API Gateway**. First 1 million calls to Lambda per month are always free, but API Gateway calls will be [charged](https://aws.amazon.com/api-gateway/pricing/) after the first 12 months.

<br/>

### What is Lambda

Lambda is a packge of code. Lambda runs when called.

<br/>

### What is API Gateway

API Gateway connects user-side apps and the APIs somewhere else. API Gateway is able to receive, authenticate, pre-process, transform, and proxy user-side requests to the APIs. Then it do the almost same things to the return values from the APIs, and send them back to the user.

<br/>

## Start Building the Hello World

Note: use the official [document](https://docs.aws.amazon.com/lambda/latest/dg/get-started-create-function.html) as reference.

Firstly we choose the `microservice-http-endpoint-python3` **(this is not the Hello World blueprint used by the official document)**.

Then in the official document, we are asked to 'do the following', but there's not enough explanations. So we need to have some more information on that here.

<h3>What is a Role (a.k.a IAM Role/Execution Role)<br/>
<small>(IAM: AWS Identity and Access Management)</small></h3>

A role is carried by a user. A role is a set of permissions. When associating Lambda with a role, the permissions of the role is passed to the Lambda.

When we choose 'Create new role from template(s)' (as instructed in the document), we are actually: putting together one (or several) set(s) of permissions, storing them all in a newly created role, and then giving the role to the Lambda.

---

### What are APIs, Resources, and Methods in API Gateway

API is, as its name suggests, API. An API contains a set of Resources. A Resource contains a set of Methods. A Resource can contain Child Resource(s). A Resource has a path, which constructs the invocation URL to the Resource. Then inside a Resource, each Method (HTTP GET/POST/etc.) maps user-side calls of the specific HTTP method, to the underlying API (the Lambda in our case).

---

When choosing security configuration during our Hello World Lambda creation, remember to choose 'Open', because we want it to be publicly accessible.

After creation, we don't want to go through the manual test process in the document. We want to make it available for real use. So we modify the Lambda code to:

{% highlight python %}
def respond(res):
    return {
        'statusCode': '200',
        'body': res,
        'headers': {
            'Content-Type': 'text/plain',
        },
    }


def lambda_handler(event, context):
    return respond(event['requestContext']['identity']['sourceIp'])
{% endhighlight%}

The official Hello World document did not tell us what `event` and `context` are. We also don't know what we should return. In fact, the documentation for `event` and return value is [here](https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format). And for `context`, see [here](https://docs.aws.amazon.com/lambda/latest/dg/python-context-object.html).

Scrolling down the page containing your code, you may want to adjust the basic settings (memory, etc.) for your lambda. When done, save your modifications.

Now let's try it! You can retrieve the invocation URL in the Triggers tab in your newly created Lambda; just click the little triangle in the API Gateway Trigger. Or otherwise, you can also see it from API Gateway page > Stages. Then do `curl https://your-invoke-url`, and you will see your IP returned!

You may also want to adjust settings in API Gateway. Just remember to do Actions > Deploy API after adjustments.

Our journey of Hello World ends here!

<br/>

### Some Extra Fun: Access with Custom Domain Name

We will introduce two ways for this here. The first is to use some service to make a 301/302 redirection to the API invoke URL, and the second is to do it with API Gateway.

Drawbacks for each method: the first method may be slower; the second does not support HTTP (only HTTPS is supported, if I didn't miss anything).

For the second method, we need: a domain, an ACM (AWS Certificate Manager) certificate, and some configuration.

First go to ACM (just search for it in AWS console), and make sure the correct region is selected. This is required because we are using Lambda, not Lambda@Edge, so the regions of our Lambda and the certificate need to be the same (this is my theory; I didn't test it, though). To change region, refer to the region configuration in the upper right corner of the page.

Then click request a certificate, and go through the process. After that, go back to API Gateway > Custom Domain Names. Create a custom domain name (select Regional), and add a base path mapping (optional). For example, we can map https://ip.tld/ directly to the Lambda invoke URL https://some-aws-server.com/prod/SomeLambda. Finally, save, and we are all done.
