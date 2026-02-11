# COURSE PROJECT 

# Project Objective
Working in pairs (engineering squads), you will assume the role of Staff Software Engineers hired to take over a "distressed" legacy application. Your mission is not merely to write code, but to stabilize, secure, and modernize the system using advanced engineering practices. You must collaborate to apply AI for reverse engineering, implement governance metrics, secure the supply chain, and optimize for cloud economics, documenting your strategic decisions along the way.

# Why we chose this project
Hemos elegido The Vulnerable API porque, como expertos en Infraestructura, Cloud y DevOps, nos motivan los sistemas que presentan retos técnicos desde el inicio. Al detectar que el proyecto tenía problemas para arrancar, lo vimos como la oportunidad perfecta para aplicar nuestra experiencia estabilizando entornos. Nuestro objetivo es transformar este sistema inestable en una API sólida, segura y eficiente, aplicando prácticas modernas de automatización y optimización.

# Delivery 1: Discovery & Reverse Engineering

Mini-Rubric:
[☑️] Context Map accurately reflects the codebase structure.
https://www.notion.so/Context-Map-AI-Driven-Discovery-vulnerable-node-302d301c9b7d81af8f87fccbdbb2ca65

[☑️] User Stories are traceable to specific modules/files.
https://www.notion.so/Backlog-Recovery-User-Stories-Traceability-vulnerable-node-302d301c9b7d81e89e29c48107862a4b

[☑️] Onboarding log clearly identifies friction points.
https://www.notion.so/DevEx-Audit-Onboarding-Log-NextCode-302d301c9b7d814a8b23f48ea52fd5ee

Vulnerable Node
===============

![Logo](https://raw.githubusercontent.com/cr0hn/vulnerable-node/master/images/logo-small.png)

*Vulnerable Node: A very vulnerable web site written in NodeJS*

Codename | PsEA
-------- | ----
Version | 1.0
Code | https://github.com/cr0hn/vulnerable-node
Issues | https://github.com/cr0hn/vulnerable-node/issues/
Author | Daniel Garcia (cr0hn) - @ggdaniel

# Support this project

Support this project (to solve issues, new features...) by applying the Github "Sponsor" button.

# What's this project?

The goal of this project is to be a project with really vulnerable code in NodeJS, not simulated.

## Why?

Similar project, like OWASP Node Goat, are pretty and useful for learning process but not for a real researcher or studding vulnerabilities in source code, because their code is not really vulnerable but simulated.

This project was created with the **purpose of have a project with identified vulnerabilities in source code with the finality of can measure the quality of security analyzers tools**.

Although not its main objective, this project also can be useful for:

- Pentesting training.
- Teaching: learn how NOT programming in NodeJS.

The purpose of project is to provide a real app to test the quality of security source code analyzers in white box processing.

## How?

This project simulates a real (and very little) shop site that has identifiable sources points of common vulnerabilities.

## Installation

The most simple way to run the project is using docker-compose, doing this:

```bash

# git clone https://github.com/cr0hn/vulnerable-node.git vulnerable-node
# cd vulnerable-node/
# docker-compose build && docker-compose up
Building postgres_db
Step 1 : FROM library/postgres
---> 247a11721cbd
Step 2 : MAINTAINER "Daniel Garcia aka (cr0hn)" <cr0hn@cr0hn.com>
---> Using cache
---> d67c05e9e2d5
Step 3 : ADD init.sql /docker-entrypoint-initdb.d/
....
```

## Running

Once docker compose was finished, we can open a browser and type the URL: `127.0.0.1:3000` (or the IP where you deployed the project):

![Login screen](https://raw.githubusercontent.com/cr0hn/vulnerable-node/master/images/login.jpg)

To access to website you can use displayed in landing page:

- admin : admin
- roberto : asdfpiuw981

Here some images of site:

![home screen](https://raw.githubusercontent.com/cr0hn/vulnerable-node/master/images/home.jpg)

![shopping](https://raw.githubusercontent.com/cr0hn/vulnerable-node/master/images/shop.jpg)

![purchased products](https://raw.githubusercontent.com/cr0hn/vulnerable-node/master/images/purchased.jpg)

# Vulnerabilities

## Vulnerability list:

This project has the most common vulnerabilities of `OWASP Top 10 <https://www.owasp.org/index.php/Top_10_2013-Top_10>`:

- A1  - Injection
- A2  - Broken Authentication and Session Management
- A3  - Cross-Site Scripting (XSS)
- A4  - Insecure Direct Object References
- A5  - Security Misconfiguration
- A6  - Sensitive Data Exposure
- A8  - Cross-Site Request Forgery (CSRF)
- A10 - Unvalidated Redirects and Forwards

## Vulnerability code location

The exactly code location of each vulnerability is pending to write

# References

I took ideas and how to explode it in NodeJS using these references:

- https://blog.risingstack.com/node-js-security-checklist/
- https://github.com/substack/safe-regex

# License

This project is released under license BSD.
