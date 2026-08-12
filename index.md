---
layout: default
title: Quality Engineering Insights
description: Two decades of software and quality engineering distilled into practical insights on test strategy, automation ROI, and engineering leadership.
---

{% assign security_posts = site.posts | where_exp: "post", "post.categories contains 'Security'" %}
{% assign software_posts = site.posts | where_exp: "post", "post.categories contains 'Software Engineering'" %}
{% assign automation_posts = site.posts | where_exp: "post", "post.categories contains 'Test Automation' or post.categories contains 'Quality Engineering'" %}

{% assign hero_post = site.posts | where: "featured", true | first %}
{% unless hero_post %}{% assign hero_post = site.posts | first %}{% endunless %}
{% assign rail_posts = site.posts | where_exp: "post", "post.url != hero_post.url" %}

<div class="home-2026">

  <!-- 1. POSITIONING BAND -->
  <section class="h26-lede" aria-label="Site introduction">
    <div class="h26-lede-main">
      <p class="h26-kicker">Quality engineering, examined</p>
      <h1 class="h26-headline">Most quality problems are budget problems in disguise.</h1>
    </div>
    <div class="h26-lede-aside">
      <p class="h26-standfirst">Two decades of software and quality engineering, written for the people who have to defend the trade-offs: test strategy, automation ROI, security debt, and the operational calls that decide whether systems hold up in production.</p>
      <p class="h26-lede-link"><a href="{{ '/blog/' | relative_url }}">Browse the full archive &rarr;</a></p>
    </div>
  </section>

  <!-- 2. CREDIBILITY STRIP -->
  <section class="h26-facts" aria-label="At a glance">
    <div class="h26-fact"><span class="h26-fact-num">20+</span><span class="h26-fact-label">years in testing &amp; automation</span></div>
    <div class="h26-fact"><span class="h26-fact-num">{{ site.posts.size }}</span><span class="h26-fact-label">essays in the archive</span></div>
    <div class="h26-fact"><span class="h26-fact-num">3</span><span class="h26-fact-label">beats: automation, engineering, security</span></div>
    <div class="h26-fact"><span class="h26-fact-num">100%</span><span class="h26-fact-label">human-reviewed and fact-checked</span></div>
  </section>

  <!-- 3. LEAD STORY + RAIL -->
  <div class="h26-news">

    <article class="h26-lead">
      <div class="h26-lead-flags">
        <span class="h26-flag">Latest</span>
        {% if hero_post.categories %}<span class="h26-section-label">{{ hero_post.categories | first }}</span>{% endif %}
      </div>

      {% if hero_post.image %}
      <a href="{{ hero_post.url | relative_url }}" class="h26-lead-image">
        {% include responsive-image.html src=hero_post.image alt=hero_post.title %}
      </a>
      {% endif %}

      <h2 class="h26-lead-title">
        <a href="{{ hero_post.url | relative_url }}"><span class="sr-only">Latest post: </span>{{ hero_post.title }}</a>
      </h2>

      {% if hero_post.subtitle %}<p class="h26-lead-subtitle">{{ hero_post.subtitle }}</p>{% endif %}

      <p class="h26-lead-excerpt">{{ hero_post.description | default: hero_post.excerpt | strip_html | truncatewords: 40 }}</p>

      <div class="h26-lead-meta">
        <a href="{{ hero_post.url | relative_url }}" class="h26-lead-cta">Read the analysis &rarr;</a>
        <span class="h26-rule" aria-hidden="true"></span>
        <time datetime="{{ hero_post.date | date_to_xmlschema }}">{{ hero_post.date | date: "%B %-d, %Y" }}</time>
        <span class="h26-rule" aria-hidden="true"></span>
        {% assign hero_words = hero_post.content | number_of_words %}
        <span>{{ hero_words | divided_by: 200 | plus: 1 }} min read</span>
      </div>
    </article>

    {% if rail_posts.size > 0 %}
    <aside class="h26-rail" aria-labelledby="h26-rail-heading">
      <h2 class="h26-rail-heading" id="h26-rail-heading">More from the blog</h2>
      {% for post in rail_posts limit: 3 %}
      <article class="h26-rail-item">
        {% if post.categories %}<p class="h26-rail-category">{{ post.categories | first }}</p>{% endif %}
        <h3 class="h26-rail-title"><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h3>
        <p class="h26-rail-excerpt">{{ post.description | default: post.excerpt | strip_html | truncatewords: 20 }}</p>
        {% assign rail_words = post.content | number_of_words %}
        <p class="h26-rail-meta">{{ post.date | date: "%B %-d, %Y" }} &middot; {{ rail_words | divided_by: 200 | plus: 1 }} min</p>
      </article>
      {% endfor %}
      <p class="h26-rail-more"><a href="{{ '/blog/' | relative_url }}">View all posts &rarr;</a></p>
    </aside>
    {% endif %}

  </div>

  <!-- 4. TOPICS -->
  <section class="h26-topics" aria-labelledby="h26-topics-heading">
    <div class="h26-topics-head">
      <h2 class="h26-topics-heading" id="h26-topics-heading">Browse by topic</h2>
      <p class="h26-topics-note">{{ site.posts.size }} essays, three beats</p>
    </div>
    <div class="h26-topics-grid">

      <a href="{{ '/test-automation/' | relative_url }}" class="h26-topic is-primary">
        <p class="h26-topic-count"><span class="h26-topic-num">{{ automation_posts.size }}</span> <span class="h26-topic-unit">posts</span></p>
        <h3 class="h26-topic-title">Test automation in practice</h3>
        <p class="h26-topic-desc">The economics, maintenance realities, and framework choices behind automation programmes that have to survive real product change.</p>
        <span class="h26-topic-link">Browse the analysis &rarr;</span>
      </a>

      <a href="{{ '/software-engineering/' | relative_url }}" class="h26-topic">
        <p class="h26-topic-count"><span class="h26-topic-num">{{ software_posts.size }}</span> <span class="h26-topic-unit">posts</span></p>
        <h3 class="h26-topic-title">Software engineering systems</h3>
        <p class="h26-topic-desc">Platform engineering, AI-assisted delivery, and the architectural decisions that separate durable software from short-lived output.</p>
        <span class="h26-topic-link">Browse the essays &rarr;</span>
      </a>

      <a href="{{ '/security/' | relative_url }}" class="h26-topic">
        <p class="h26-topic-count"><span class="h26-topic-num">{{ security_posts.size }}</span> <span class="h26-topic-unit">posts</span></p>
        <h3 class="h26-topic-title">Security and resilience</h3>
        <p class="h26-topic-desc">Security debt, enterprise threat detection, and the operating choices that harden systems before incidents turn expensive.</p>
        <span class="h26-topic-link">Browse the reporting &rarr;</span>
      </a>

    </div>
  </section>

  <!-- 5. AUTHOR -->
  <section class="h26-author" aria-label="About the author">
    <div class="h26-author-avatar" aria-hidden="true">OV</div>
    <div class="h26-author-body">
      <p class="h26-author-kicker">Who writes this</p>
      <h2 class="h26-author-name">{{ site.author.name }}</h2>
      <p class="h26-author-bio">{{ site.author.bio }} &mdash; most of it spent arguing for the unglamorous work that keeps releases boring.</p>
      <div class="h26-author-links">
        {% comment %}
          LinkedIn/GitHub/Twitter/RSS intentionally omitted: the site footer's
          "Connect" column carries them a few hundred pixels below. A Liquid
          comment, not an HTML one, so the rationale stays in source instead of
          shipping to every reader.
        {% endcomment %}
        <a href="{{ '/about/' | relative_url }}" class="h26-author-link is-primary">About me</a>
        <a href="mailto:{{ site.email }}" class="h26-author-link">Contact</a>
      </div>
    </div>
  </section>

  <!-- Newsletter CTA is rendered by _layouts/default.html for the whole CTA
       allowlist (home, posts, blog index, category, about). No inline include
       here to avoid a double render (visual-audit #16). -->

</div>
