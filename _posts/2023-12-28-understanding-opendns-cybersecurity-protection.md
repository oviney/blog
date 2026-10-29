---
layout: post
title: "The invisible shield: DNS as cybersecurity's first line"
subtitle: "DNS filtering can block some malicious destinations, but its coverage depends on resolver configuration and other security controls."
date: 2023-12-28
author: "Ouray Viney"
categories: ["Security"]
tags: [security, cybersecurity, enterprise-security]
image: /assets/images/dns-invisible-shield.png
image_alt: "DNS request packets bouncing off a protective shield in front of a network"
image_caption: "Illustration: DNS filtering acts as an early shield against malicious traffic"
description: "How DNS filtering can help block malicious destinations and where its coverage depends on configuration."
---

Many attacks require a device to find a destination on the internet. DNS filtering can block lookups for known malicious domains, giving defenders a chance to interrupt some phishing, malware and command-and-control traffic. Its effectiveness depends on the resolver and threat intelligence used, and it is one layer of a broader security strategy.


## The DNS advantage

The appeal of DNS security lies in its timing. Many connections use a DNS lookup to resolve a name to an address; cached results and direct IP connections can avoid a new lookup. By intercepting that question, a security provider can refuse to answer when the destination is known to harbour malware, phishing pages, or botnet command infrastructure. No software agent is required on the device. No signature database needs updating on every laptop. The protection blankets everything on the network, from an engineer's workstation to a neglected IoT thermostat that will never receive a security patch.

DNS filtering is attractive because it can apply policy at a shared resolver. That coverage depends on which devices and applications actually use the resolver and on the quality of the detection rules.

## Where the shield cracks

Yet DNS security is not impervious. DNS over HTTPS and DNS over TLS encrypt queries, which can limit the visibility available to a network-based filter if a client uses a different resolver. The effect depends on browser settings and enterprise policy. [Mozilla's documentation](https://support.mozilla.org/en-US/kb/dns-over-https) says Firefox's default protection can disable DNS over HTTPS when enterprise policies or network signals require it. Organisations should test which resolvers their managed devices actually use rather than assume that encryption always bypasses their controls.

Encrypted DNS does not automatically bypass security controls. Test the organisation's browser policies and resolver configuration to identify where visibility or enforcement is missing.

Attackers can also use newly registered or generated domains to evade known-domain blocklists. DNS filtering benefits from being combined with endpoint, identity and network signals.

## The integration imperative

The most effective deployments treat DNS security not as a standalone solution but as one layer in a defence-in-depth strategy. Palo Alto Networks, which competes with Cisco in this space, argues that DNS telemetry becomes most valuable when correlated with endpoint detection, network traffic analysis, and identity management — a convergence the company calls "platform security."

Microsoft's own enterprise security division has taken a different approach, embedding DNS filtering directly into its Defender suite so that policy enforcement follows the user rather than depending on network topology. For organisations with remote workforces that never touch the corporate network, this model addresses a fundamental limitation of traditional DNS filtering: it only protects traffic that flows through it.

The choice between network-centric and endpoint-centric DNS security will define the next phase of this market. Organisations that treat DNS as a checkbox — install Umbrella, declare victory — will discover that the shield has gaps they never tested. Those that integrate DNS telemetry into their broader security operations, correlating query patterns with authentication anomalies and endpoint behaviour, will build something genuinely resilient.

DNS filtering is not a substitute for a complete security posture. Its strongest role is as one control and source of telemetry alongside endpoint protection, identity controls, monitoring and user education.

## References

1. Mozilla, [DNS over HTTPS protection levels](https://support.mozilla.org/en-US/kb/dns-over-https).
2. CISA, [Secure Cloud Business Applications technical reference architecture](https://www.cisa.gov/sites/default/files/2023-06/CSSO-SCUBA-TRA-guidance%20document_508c.pdf).
