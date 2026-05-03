---
layout: default
title: Quality Engineering Insights
---

<div class="homepage">

  {% assign security_posts = site.posts | where_exp: "post", "post.categories contains 'Security'" %}
  {% assign software_posts = site.posts | where_exp: "post", "post.categories contains 'Software Engineering'" %}
  {% assign automation_posts = site.posts | where_exp: "post", "post.categories contains 'Test Automation' or post.categories contains 'Quality Engineering'" %}

  <section class="home-intro" aria-label="Site introduction">
    <p class="home-intro-kicker">For senior engineers and engineering leaders</p>
    <p class="home-intro-text">Commentary on quality engineering, test automation, software engineering, and security, with a bias toward the operational trade-offs that decide whether systems hold up in production.</p>
    <p class="home-intro-links">
      <a href="{{ '/blog/' | relative_url }}">Browse the full archive &rarr;</a>
    </p>
  </section>

  <!-- 1. HERO SECTION: Latest / featured post -->
  {% assign hero_post = site.posts | where: "featured", true | first %}
  {% unless hero_post %}
    {% assign hero_post = site.posts | first %}
  {% endunless %}

  <section class="hero-post">
    {% if hero_post.image %}
    <a href="{{ hero_post.url | relative_url }}" class="hero-post-image">
      {% include responsive-image.html src=hero_post.image alt=hero_post.title %}
    </a>
    {% endif %}

    <div class="hero-post-content">
      {% if hero_post.categories %}
      <div class="hero-post-category">{{ hero_post.categories | first }}</div>
      {% endif %}

      <h1 class="hero-post-title">
        <a href="{{ hero_post.url | relative_url }}"><span class="sr-only">Latest post: </span>{{ hero_post.title }}</a>
      </h1>

      {% if hero_post.subtitle %}
      <p class="hero-post-subtitle">{{ hero_post.subtitle }}</p>
      {% endif %}

      <p class="hero-post-excerpt">{{ hero_post.excerpt | strip_html | truncatewords: 40 }}</p>

      <div class="hero-post-meta">
        <time datetime="{{ hero_post.date | date_to_xmlschema }}">
          {{ hero_post.date | date: "%B %-d, %Y" }}
        </time>
        <span class="meta-separator">|</span>
        {% assign words = hero_post.content | number_of_words %}
        <span>{{ words | divided_by: 200 | plus: 1 }} min read</span>
      </div>

      <a href="{{ hero_post.url | relative_url }}" class="hero-post-cta">Read more &rarr;</a>
    </div>
  </section>

  <!-- 2. FOCUS AREAS: 3-column cards with stronger topic destinations -->
  <section class="home-focus-areas" aria-labelledby="focus-areas-heading">
    <h2 class="home-recent-heading" id="focus-areas-heading">Browse by Topic</h2>
    <div class="home-focus-grid">

      <div class="home-focus-card">
        <div class="home-focus-icon" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <p class="home-focus-meta">{{ security_posts.size }} posts</p>
        <h3 class="home-focus-title">Security and resilience</h3>
        <p class="home-focus-desc">Explore security debt, enterprise threat detection, and the operating choices that harden systems before incidents turn expensive.</p>
        <a href="{{ '/security/' | relative_url }}" class="home-focus-link">Browse security reporting &rarr;</a>
      </div>

      <div class="home-focus-card">
        <div class="home-focus-icon" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>
        </div>
        <p class="home-focus-meta">{{ software_posts.size }} posts</p>
        <h3 class="home-focus-title">Software engineering systems</h3>
        <p class="home-focus-desc">Read on platform engineering, AI-assisted delivery, and the architectural decisions that separate durable software from short-lived output.</p>
        <a href="{{ '/software-engineering/' | relative_url }}" class="home-focus-link">Browse software engineering essays &rarr;</a>
      </div>

      <div class="home-focus-card">
        <div class="home-focus-icon" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"/>
            <line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/>
            <line x1="2" y1="20" x2="22" y2="20"/>
          </svg>
        </div>
        <p class="home-focus-meta">{{ automation_posts.size }} posts</p>
        <h3 class="home-focus-title">Test automation in practice</h3>
        <p class="home-focus-desc">Follow the economics, maintenance realities, and framework choices behind automation programmes that have to survive real product change.</p>
        <a href="{{ '/test-automation/' | relative_url }}" class="home-focus-link">Browse test automation analysis &rarr;</a>
      </div>

    </div>
  </section>

  <!-- 3. FEATURED POSTS GRID: 2-3 recent posts -->
  {% assign remaining_posts = site.posts | where_exp: "post", "post.url != hero_post.url" %}
  {% if remaining_posts.size > 0 %}
  <section class="home-recent" aria-labelledby="recent-posts-heading">
    <h2 class="home-recent-heading" id="recent-posts-heading">From the Blog</h2>
    <div class="topic-grid">
      {% for post in remaining_posts limit: 3 %}
      <article class="topic-card">
        {% if post.image %}
        <a href="{{ post.url | relative_url }}" class="topic-card-image">
          {% include responsive-image.html src=post.image alt=post.title loading="lazy" %}
        </a>
        {% endif %}
        <div class="topic-card-content">
          {% if post.categories %}
          <div class="topic-category">{{ post.categories | first }}</div>
          {% endif %}
          <h3 class="topic-card-title">
            <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
          </h3>
          <p class="topic-card-excerpt">{{ post.excerpt | strip_html | truncatewords: 20 }}</p>
          <div class="topic-card-meta">
            <span class="topic-meta-item">{{ post.date | date: "%B %-d, %Y" }}</span>
          </div>
        </div>
      </article>
      {% endfor %}
    </div>
    <p class="view-all"><a href="/blog/">View all posts &rarr;</a></p>
  </section>
  {% endif %}

  <!-- 4. BRIEF BIO WITH HEADSHOT -->
  <section class="home-bio" aria-label="About the author">
    <div class="home-bio-inner">
      <div class="home-bio-avatar" aria-hidden="true">OV</div>
      <div class="home-bio-content">
        <h2 class="home-bio-name">{{ site.author.name }}</h2>
        <p class="home-bio-text">{{ site.author.bio }}</p>
        <div class="home-bio-links">
          <a href="{{ '/about/' | relative_url }}" class="home-bio-link">About me</a>
          <a href="https://linkedin.com/in/ourayviney" class="home-bio-link" rel="noopener noreferrer" target="_blank" aria-label="LinkedIn (opens in new tab)">LinkedIn</a>
          <a href="https://github.com/{{ site.github_username }}" class="home-bio-link" rel="noopener noreferrer" target="_blank" aria-label="GitHub (opens in new tab)">GitHub</a>
          <a href="{{ '/feed.xml' | relative_url }}" class="home-bio-link">RSS Feed</a>
        </div>
      </div>
    </div>
  </section>

  <!-- 5. NEWSLETTER SIGNUP -->
  {% include newsletter.html %}

</div>
