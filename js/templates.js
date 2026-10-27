/**
 * MDF Studio - Built-in Markdown Templates
 * Ready-to-use professional document templates
 */

(function (window) {
  'use strict';

  const TEMPLATES = {
    showcase: {
      id: 'showcase',
      name: '✨ Full Feature Showcase',
      description: 'Comprehensive demo covering Math, Mermaid, Tables, Code, and Alerts',
      theme: 'modern',
      paperSize: 'a4',
      orientation: 'portrait',
      content: `# MDF Studio - Comprehensive Showcase
Welcome to **MDF Studio**, an easy-to-use, professional Markdown to PDF converter.

[TOC]

## 1. Mathematical Formulas (KaTeX)

Render vector-crisp mathematical equations inline or as display blocks:

The Schrödinger equation describes how the quantum state of a physical system changes over time:

$$i\\hbar \\frac{\\partial}{\\partial t} \\Psi(\\mathbf{r}, t) = \\left[ -\\frac{\\hbar^2}{2m}\\nabla^2 + V(\\mathbf{r},t) \\right] \\Psi(\\mathbf{r}, t)$$

Inline equations integrate seamlessly: the Euler identity is $e^{i\\pi} + 1 = 0$, and the normal distribution density is $f(x) = \\frac{1}{\\sigma \\sqrt{2\\pi}} e^{-\\frac{1}{2}\\left(\\frac{x-\\mu}{\\sigma}\\right)^2}$.

## 2. Interactive Mermaid Diagrams

Diagrams are rendered directly as vector SVGs and scale crisply for print:

\`\`\`mermaid
graph TD
    A[Markdown File] --> B[MDF Parsing Engine]
    B --> C{Process Nodes}
    C -->|Equations| D[KaTeX Vector Math]
    C -->|Syntax| E[Prism Highlighting]
    C -->|Diagrams| F[Mermaid SVG Engine]
    D --> G[Print Optimization Engine]
    E --> G
    F --> G
    G --> H[High-Fidelity PDF Output]
\`\`\`

## 3. GitHub-Style Alert Callouts

Communicate important points with color-coded callouts:

> [!NOTE]
> This is an informational note highlighting helpful context or background details.

> [!TIP]
> Use \`Ctrl + P\` to open the native browser vector print dialog for publication-grade PDF export!

> [!WARNING]
> Keep code blocks within page bounds to prevent awkward page overflow in printed documents.

> [!CAUTION]
> Avoid deeply nested tables when formatting for compact mobile or small paper sheets.

## 4. Code Syntax Highlighting

Clean, readable syntax highlighting with line wrap handling:

\`\`\`python
import numpy as np

def compute_eigenvalues(matrix: np.ndarray) -> np.ndarray:
    """Compute eigenvalues of a real symmetric matrix."""
    if not np.allclose(matrix, matrix.T):
        raise ValueError("Matrix must be symmetric")
    eigenvalues, _ = np.linalg.eigh(matrix)
    return eigenvalues

# Example execution
A = np.array([[4.0, 1.0], [1.0, 3.0]])
print("Eigenvalues:", compute_eigenvalues(A))
\`\`\`

## 5. Structured Data Tables

Tables are styled with crisp headers, alternating rows, and proper alignments:

| Metric | Target | Q1 Actual | Q2 Actual | Status |
| :--- | :---: | :---: | :---: | :---: |
| Build Velocity | < 2.5s | 1.8s | 1.4s | 🟢 Exceeded |
| Test Coverage | > 90% | 92.4% | 95.1% | 🟢 Exceeded |
| Memory Footprint | < 64MB | 48MB | 44MB | 🟢 Exceeded |
| Crash Rate | 0.00% | 0.00% | 0.00% | 🟢 Perfect |

---page-break---

## 6. Page Breaks & Task Lists

You can insert clean page breaks with \`---page-break---\` to start a new page cleanly.

- [x] High-resolution vector PDF export
- [x] Math equation support via KaTeX
- [x] Dynamic diagrams with Mermaid
- [x] Custom headers, footers, and page numbers
- [ ] Offline mobile companion app

> *"Simplicity is the prerequisite for reliability."*  
> — Edsger W. Dijkstra
`
    },

    tech_spec: {
      id: 'tech_spec',
      name: '🛠️ Software Architecture & API Spec',
      description: 'Technical document with system diagrams, API tables, and code snippets',
      theme: 'modern',
      paperSize: 'a4',
      orientation: 'portrait',
      content: `# Distributed Event Bus - Architecture & API Specification

**Author:** Infrastructure Platform Team  
**Date:** October 2026  
**Version:** 2.4.0-RELEASE  
**Status:** Approved for Implementation

---

## 1. Executive Summary

This specification outlines the architecture, data models, and API endpoints for the next-generation **Distributed Event Bus (DEB)**. The system is designed to sustain 500,000 events/second at sub-5ms p99 latency across multi-region clusters.

[TOC]

## 2. System Architecture

The event stream utilizes an partitioned log architecture with distributed consensus:

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor Client
    participant Gateway as API Gateway
    participant Ingestion as Ingestion Service
    participant Log as Raft Partition Log
    participant Consumer as Downstream Workers

    Client->>Gateway: POST /v1/events/batch
    Gateway->>Ingestion: Validate & Tokenize
    Ingestion->>Log: Append Batch Entry (Quorum = 3)
    Log-->>Ingestion: ACK Replicated
    Ingestion-->>Gateway: HTTP 202 Accepted
    Gateway-->>Client: { status: "enqueued", batchId: "b-88912" }
    Log->>Consumer: Push Event Stream
\`\`\`

## 3. Core API Endpoints

All endpoints require TLS 1.3 and a valid bearer token in the \`Authorization\` header.

| Method | Path | Request Body | Response Code | Description |
| :--- | :--- | :--- | :---: | :--- |
| \`POST\` | \`/v1/events/publish\` | JSON payload | \`201 Created\` | Publishes single event payload |
| \`POST\` | \`/v1/events/batch\` | Array of events | \`202 Accepted\` | Ingests up to 1,000 events |
| \`GET\` | \`/v1/streams/{id}/health\`| None | \`200 OK\` | Returns partition health status |
| \`DELETE\`| \`/v1/streams/{id}/replay\`| Replay spec | \`204 No Content\`| Truncates replay cursors |

### Example Ingestion Request

\`\`\`bash
curl -X POST https://api.eventbus.internal/v1/events/batch \\
  -H "Authorization: Bearer sec_tok_991823" \\
  -H "Content-Type: application/json" \\
  -d '{
    "topic": "orders.fulfillment",
    "partitionKey": "usr_9918",
    "payload": {
      "orderId": "ord_100234",
      "amount": 299.50,
      "currency": "USD"
    }
  }'
\`\`\`

> [!IMPORTANT]
> The batch size must never exceed 4MB per request. Requests larger than 4MB will receive HTTP 413 (Payload Too Large).

---page-break---

## 4. Error Handling & Retry Policies

When transient errors occur, clients must implement exponential backoff with full jitter:

$$t_{\\text{wait}} = \\min(t_{\\text{max}}, t_{\\text{base}} \\times 2^{\\text{attempt}}) \\times \\text{random}(0, 1)$$

\`\`\`typescript
interface RetryPolicy {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

const defaultPolicy: RetryPolicy = {
  maxRetries: 5,
  baseDelayMs: 100,
  maxDelayMs: 3000
};
\`\`\`

## 5. Security & Compliance
- Data is encrypted at rest using AES-256-GCM.
- TLS 1.3 with mutual authentication is mandatory across all node-to-node links.
`
    },

    academic: {
      id: 'academic',
      name: '🎓 Academic Research Paper',
      description: 'Formal scientific layout with abstract, equations, and IEEE-style structure',
      theme: 'academic',
      paperSize: 'a4',
      orientation: 'portrait',
      content: `# Efficient Neural State Space Models for Long-Sequence Contexts

**Dr. Alexander Vance**, Department of Computer Science, MIT  
**Dr. Elena Rostova**, Institute for Advanced Algorithms  
*Published in Proceedings of the International Conference on Machine Learning (ICML)*

---

### Abstract
We present *Linear-Recurrent State Representation (LRSR)*, a sub-quadratic sequence model designed to bridge the computational gap between Transformers and classic recurrent units. By projecting the continuous hidden transition into an orthogonal state manifold, LRSR achieves $\\mathcal{O}(L)$ compute complexity and $\\mathcal{O}(1)$ inference memory overhead. Empirical evaluations across benchmarks demonstrate an average accuracy parity of 99.2% relative to FlashAttention-2 with a 4.8x throughput speedup on contexts exceeding 128,000 tokens.

---

## 1. Introduction
The transformer architecture with scaled dot-product attention has redefined sequence modeling across natural language, speech, and biology. However, the standard attention mechanism exhibits quadratic time and memory complexity with sequence length $N$:

$$\\text{Attention}(Q, K, V) = \\text{softmax}\\left( \\frac{QK^T}{\\sqrt{d_k}} \\right) V$$

This quadratic bottleneck limits real-time synthesis of genomic sequences and high-frequency sensor streams.

## 2. Mathematical Formulation
Consider a continuous-time linear time-invariant (LTI) system mapping input $u(t) \\in \\mathbb{R}$ to latent states $x(t) \\in \\mathbb{R}^D$:

$$\\frac{dx(t)}{dt} = \\mathbf{A} x(t) + \\mathbf{B} u(t)$$
$$y(t) = \\mathbf{C} x(t) + \\mathbf{D} u(t)$$

Under bilinear discretization with sampling interval $\\Delta$, the transition matrix $\\mathbf{\\bar{A}}$ and input matrix $\\mathbf{\\bar{B}}$ become:

$$\\mathbf{\\bar{A}} = \\left( \\mathbf{I} - \\frac{\\Delta}{2} \\mathbf{A} \\right)^{-1} \\left( \\mathbf{I} + \\frac{\\Delta}{2} \\mathbf{A} \\right)$$

$$\\mathbf{\\bar{B}} = \\left( \\mathbf{I} - \\frac{\\Delta}{2} \\mathbf{A} \\right)^{-1} \\Delta \\mathbf{B}$$

## 3. Empirical Results

| Architecture | Context Size | Perplexity $\\downarrow$ | Inference Mem (MB) | Throughput (tok/s) |
| :--- | :---: | :---: | :---: | :---: |
| Transformer (Standard) | 8k | 12.4 | 1,420 | 18,200 |
| Transformer (Flash-2) | 32k | 11.8 | 3,890 | 34,100 |
| Mamba-1 | 64k | 11.9 | 420 | 92,000 |
| **LRSR (Ours)** | **128k** | **11.6** | **280** | **148,000** |

---page-break---

## 4. Conclusion & Future Directions
Our findings validate that structured orthogonal state spaces eliminate the attention quadratic memory penalty without loss of associative recall. Subsequent studies will explore multi-modal vision-language scaling.

### References
1. Gu, A., & Dao, T. (2023). *Mamba: Linear-Time Sequence Modeling with Selective State Spaces*. arXiv:2312.00752.
2. Vaswani, A., et al. (2017). *Attention Is All You Need*. NeurIPS 2017.
`
    },

    executive: {
      id: 'executive',
      name: '💼 Executive Project Proposal',
      description: 'Corporate business plan with executive summary, budget, and milestones',
      theme: 'executive',
      paperSize: 'a4',
      orientation: 'portrait',
      content: `# Strategic Enterprise Cloud Migration: FY2027 Project Charter

**Prepared For:** Executive Investment Committee  
**Prepared By:** Corporate Engineering & Cloud Architecture  
**Target Completion:** Q3 2027  
**Total Proposed Budget:** $1,850,000 USD

---

## Executive Summary

Our current on-premises data center infrastructure is approaching end-of-service lifecycle, incurring rising maintenance fees ($420k/yr) and operational disruption risks. This project charter proposes a comprehensive migration to modern managed cloud architecture, delivering:

1. **34% Annual Run-Rate Cost Reduction** by decommissioning legacy hardware.
2. **99.99% Availability SLA** backed by multi-region redundancy.
3. **SOC2 Type II and HIPAA Compliance Readiness** within 6 months.

> [!IMPORTANT]
> Executive approval is required prior to December 1st to lock in the 28% multi-year reserved cloud capacity discount.

## Financial Cost-Benefit Analysis

| Expenditure Category | FY26 Current | FY27 Migration | FY28 Run-Rate | Variance (YoY) |
| :--- | :---: | :---: | :---: | :---: |
| On-Premises Colocation | $820,000 | $350,000 | $0 | -100% |
| Hardware Licensing & SAN | $460,000 | $180,000 | $0 | -100% |
| Managed Cloud Infrastructure | $140,000 | $780,000 | $740,000 | +428% |
| 24/7 Operations Staffing | $580,000 | $540,000 | $390,000 | -32% |
| **Total Annualized Spend** | **$2,000,000** | **$1,850,000** | **$1,130,000** | **-43.5% Net** |

## Implementation Roadmap

\`\`\`mermaid
gantt
    title Enterprise Cloud Migration Phases
    dateFormat  YYYY-MM
    section Planning
    Discovery & Dependency Mapping :2027-01, 2027-02
    Security Compliance Audit      :2027-02, 2027-03
    section Execution
    Pilot Database Migration       :2027-03, 2027-05
    Core Service Cutover           :2027-05, 2027-07
    Decommission Data Center       :2027-07, 2027-09
\`\`\`

---page-break---

## Risk Mitigation Strategy

- **Risk 1: Data Migration Downtime**  
  *Mitigation:* Zero-downtime dual-write change-data-capture (CDC) pipelines with automated rollback triggers.
- **Risk 2: Personnel Knowledge Gaps**  
  *Mitigation:* Mandatory AWS/GCP certification training program funded in Phase 1.

### Sign-off & Authorizations

| Role | Name | Signature | Date |
| :--- | :--- | :--- | :--- |
| Chief Technology Officer | David Miller | _____________________ | ____________ |
| VP of Infrastructure | Sarah Jenkins | _____________________ | ____________ |
| Chief Financial Officer | Robert Sterling | _____________________ | ____________ |
`
    },

    resume: {
      id: 'resume',
      name: '📄 Professional Resume / CV',
      description: 'Clean single/double page curriculum vitae with skills and timeline',
      theme: 'minimalist',
      paperSize: 'a4',
      orientation: 'portrait',
      content: `# Morgan Sterling
**Staff Software Engineer & Distributed Systems Architect**  
San Francisco, CA • (555) 019-2834 • morgan.sterling@email.com • [linkedin.com/in/morgan-sterling](https://linkedin.com) • [github.com/morgan-sterling](https://github.com)

---

## Executive Profile
Staff-level Software Engineer with 10+ years of track record building high-throughput distributed systems, real-time streaming platforms, and developer tooling. Proven expertise in Go, Rust, TypeScript, and Kubernetes. Led architecture initiatives driving 40% latency reduction across 25M daily active users.

## Core Technical Competencies
- **Languages:** Go, Rust, TypeScript, Python, SQL, C++
- **Distributed Systems:** Kafka, gRPC, Raft, CockroachDB, Redis, Temporal
- **Cloud & DevOps:** Kubernetes, AWS, Terraform, Docker, CI/CD, Prometheus
- **Architecture:** Microservices, Event-Driven Systems, API Gateway Design, High Availability

## Professional Experience

### Staff Software Engineer • Nexus Data Systems  
*January 2022 – Present • San Francisco, CA*
- Architected the real-time stream ingestion engine handling **1.4M events/sec** at 99.999% uptime using Go and Kafka.
- Reduced p99 query latency from 140ms to 24ms by introducing a distributed cache invalidation tier.
- Mentored a squad of 14 senior engineers and authored RFCs for company-wide service mesh adoption.

### Senior Distributed Systems Engineer • CloudScale Technologies  
*June 2018 – December 2021 • Seattle, WA*
- Designed and delivered multi-region state synchronization engine reducing cross-region egress costs by **$380k/year**.
- Implemented zero-downtime blue/green deployment controller in Kubernetes used by 120+ microservices.
- Received 2020 Engineering Excellence Award for leading disaster recovery automation.

---

## Education
**Master of Science in Computer Science** • Stanford University (2016 – 2018)  
**Bachelor of Science in Computer Engineering** • UC Berkeley (2012 – 2016, Magna Cum Laude)

## Selected Open Source & Publications
- **Creator of \`go-stream-pipe\`**: Lightweight stream processing framework with 4,200+ GitHub stars.
- *Deterministic Replay in Distributed Event Sourcing*, IEEE Cloud Computing Journal (2022).
`
    },

    cyber_deck: {
      id: 'cyber_deck',
      name: '⚡ Cyber Dark Tech Briefing',
      description: 'Futuristic obsidian sheet with neon accents and terminal aesthetics',
      theme: 'cyberpunk',
      paperSize: 'a4',
      orientation: 'landscape',
      content: `# NEURAL PROTOCOL SPECIFICATION // REV 9.4
**CLASSIFICATION:** TOP SECRET // SYSTEM ARCHITECTURE  
**TARGET NODE:** CLUSTER-ALPHA-7  

---

## 1. Zero-Trust Ingress Stream

The protocol enforces mutual cryptographically signed handshake tokens across all edge relay satellites:

\`\`\`mermaid
sequenceDiagram
    autonumber
    participant CyberNode as Edge Node
    participant Mesh as WireGuard Mesh
    participant Core as Quantum Core Engine

    CyberNode->>Mesh: SYN [ECDSA-P384 Handshake]
    Mesh->>Core: Authenticate Shard
    Core-->>Mesh: Ephemeral Session Token (TTL=30s)
    Mesh-->>CyberNode: Session Established (Channel Encrypted)
\`\`\`

## 2. Kernel Telemetry

| Daemon | Port | Memory RSS | IPC Throughput | Security State |
| :--- | :---: | :---: | :---: | :---: |
| \`void-daemon\` | \`8080\` | 18.4 MB | 1.8M msg/s | 🟢 ARMED |
| \`crypto-vault\`| \`9443\` | 42.1 MB | 620k ops/s | 🟢 ARMED |
| \`packet-tap\`  | \`2049\` | 12.0 MB | 4.2 Gbps   | 🟢 ARMED |

> [!CAUTION]
> Unauthorized kernel memory overrides will trigger immediate cryptographic shard detonation.
`
    },

    legal_agreement: {
      id: 'legal_agreement',
      name: '⚖️ Standard Mutual Non-Disclosure Agreement',
      description: 'Formal bilateral confidentiality contract with numbered recitals and signatures',
      theme: 'legal',
      paperSize: 'a4',
      orientation: 'portrait',
      content: `# MUTUAL NON-DISCLOSURE AGREEMENT

**THIS MUTUAL NON-DISCLOSURE AGREEMENT** (the "Agreement") is entered into as of this 26th day of October, 2026 (the "Effective Date"), by and between:

**PARTIES:**
1. **ALPHA VENTURES INC.**, a Delaware corporation having its principal office at 100 Montgomery St, San Francisco, CA ("Disclosing Party"); and
2. **RECIPIENT PARTNERS LLC**, a California limited liability company ("Receiving Party").

---

### RECITALS
**WHEREAS**, the Parties wish to explore potential business collaboration regarding confidential technology and proprietary algorithms (the "Purpose"); and  
**WHEREAS**, in connection with the Purpose, each Party may disclose to the other Party certain non-public, proprietary, or confidential information.

**NOW, THEREFORE**, in consideration of the mutual covenants contained herein, the Parties agree as follows:

### § 1. Definition of Confidential Information
"Confidential Information" refers to any non-public information disclosed by either Party to the other Party, either directly or indirectly, in writing, orally, or by inspection of tangible objects, that is designated as "Confidential" or that reasonably should be understood to be confidential given the nature of the information.

### § 2. Obligations of Receiving Party
The Receiving Party agrees:
1. To hold all Confidential Information in strict confidence and to take all reasonable precautions to protect such information;
2. Not to disclose Confidential Information to any third party without prior written consent;
3. To use Confidential Information solely for the Purpose described herein.

---page-break---

### § 3. Term and Termination
This Agreement shall remain in effect for a period of two (2) years from the Effective Date. The confidentiality obligations herein shall survive for five (5) years following termination.

### § 4. Governing Law and Jurisdiction
This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to its conflict of laws principles.

**IN WITNESS WHEREOF**, the Parties hereto have executed this Mutual Non-Disclosure Agreement as of the Effective Date.

| ALPHA VENTURES INC. | RECIPIENT PARTNERS LLC |
| :--- | :--- |
| By: ___________________________ | By: ___________________________ |
| Name: David Vance | Name: Sarah Sterling |
| Title: Chief Executive Officer | Title: Managing Partner |
| Date: October 26, 2026 | Date: October 26, 2026 |
`
    }
  };

  window.DOCUMENT_TEMPLATES = TEMPLATES;

})(window);
