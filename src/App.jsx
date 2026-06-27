import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import * as d3 from "d3";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@300;400;500&display=swap');`;

const T = {
  bg:"#0f1117", surface:"#161b27", card:"#1c2333", border:"#252f45", border2:"#2e3a55",
  accent:"#4f8ef7", accentDim:"#1a3068", green:"#34d399", red:"#f87171", amber:"#fbbf24",
  purple:"#a78bfa", cyan:"#67e8f9", text:"#e2e8f0", muted:"#64748b", dim:"#1e2a40",
};
const SEV = {
  Sev0:{color:"#ef4444",bg:"#2d1515",label:"SEV 0",priority:0},
  Sev1:{color:"#f97316",bg:"#2d1c10",label:"SEV 1",priority:1},
  Sev2:{color:"#fbbf24",bg:"#2d2510",label:"SEV 2",priority:2},
  Sev3:{color:"#4f8ef7",bg:"#0f1f40",label:"SEV 3",priority:3},
  Sev4:{color:"#64748b",bg:"#1a1f2a",label:"SEV 4",priority:4},
};

// ═══════════════════════════════════════════════════════════════════
// STATIC REFERENCE DATA — 18 services, 12 teams, 36 components
// ═══════════════════════════════════════════════════════════════════
const SERVICES = [
  // Tier 0 — foundational identity
  {id:"svc-aad",      name:"Azure Active Directory",  tier:0, team:"team-aad",        region:"Global",    sla:"99.99%"},
  // Tier 1 — core platform
  {id:"svc-keyvault", name:"Azure Key Vault",         tier:1, team:"team-sec",        region:"Multi",     sla:"99.99%"},
  {id:"svc-storage",  name:"Azure Storage",           tier:1, team:"team-storage",    region:"Multi",     sla:"99.99%"},
  {id:"svc-sql",      name:"Azure SQL",               tier:1, team:"team-sql",        region:"East US",   sla:"99.99%"},
  {id:"svc-cosmos",   name:"Azure Cosmos DB",         tier:1, team:"team-cosmos",     region:"Multi",     sla:"99.999%"},
  {id:"svc-ado",      name:"Azure DevOps",            tier:1, team:"team-ado",        region:"East US 2", sla:"99.9%"},
  {id:"svc-acr",      name:"Azure Container Registry",tier:1, team:"team-containers", region:"Multi",     sla:"99.95%"},
  {id:"svc-aks",      name:"Azure Kubernetes Service",tier:1, team:"team-containers", region:"Multi",     sla:"99.95%"},
  {id:"svc-redis",    name:"Azure Redis Cache",       tier:1, team:"team-cache",      region:"East US",   sla:"99.9%"},
  {id:"svc-lb",       name:"Azure Load Balancer",     tier:1, team:"team-net",        region:"Global",    sla:"99.99%"},
  // Tier 2 — application & messaging layer
  {id:"svc-appSvc",   name:"Azure App Service",       tier:2, team:"team-apps",       region:"West US 2", sla:"99.95%"},
  {id:"svc-functions",name:"Azure Functions",         tier:2, team:"team-apps",       region:"Multi",     sla:"99.95%"},
  {id:"svc-logicapps",name:"Azure Logic Apps",        tier:2, team:"team-apps",       region:"West US 2", sla:"99.9%"},
  {id:"svc-evhub",    name:"Azure Event Hub",         tier:2, team:"team-msg",        region:"North EU",  sla:"99.95%"},
  {id:"svc-svcbus",   name:"Azure Service Bus",       tier:2, team:"team-msg",        region:"Multi",     sla:"99.9%"},
  {id:"svc-apim",     name:"Azure API Management",    tier:2, team:"team-net",        region:"Multi",     sla:"99.95%"},
  {id:"svc-cdn",      name:"Azure CDN",               tier:2, team:"team-net",        region:"Global",    sla:"99.9%"},
  {id:"svc-monitor",  name:"Azure Monitor",           tier:2, team:"team-obs",        region:"Global",    sla:"99.9%"},
];
const TEAMS = [
  {id:"team-aad",       name:"Identity Platform",   oncall:"identity-icm@ms.com",  mgr:"cvp-identity@ms.com"},
  {id:"team-sec",       name:"Security Platform",   oncall:"sec-icm@ms.com",        mgr:"ciso@ms.com"},
  {id:"team-storage",   name:"Storage Platform",    oncall:"storage-icm@ms.com",    mgr:"vp-storage@ms.com"},
  {id:"team-sql",       name:"Data Platform",       oncall:"sql-icm@ms.com",        mgr:"cvp-data@ms.com"},
  {id:"team-cosmos",    name:"Cosmos Platform",     oncall:"cosmos-icm@ms.com",     mgr:"vp-cosmos@ms.com"},
  {id:"team-ado",       name:"DevOps Platform",     oncall:"devops-icm@ms.com",     mgr:"vp-eng@ms.com"},
  {id:"team-containers",name:"Containers Platform", oncall:"containers-icm@ms.com", mgr:"vp-containers@ms.com"},
  {id:"team-cache",     name:"Caching Platform",    oncall:"cache-icm@ms.com",      mgr:"vp-perf@ms.com"},
  {id:"team-net",       name:"Networking Platform", oncall:"net-icm@ms.com",        mgr:"cvp-network@ms.com"},
  {id:"team-apps",      name:"App Platform",        oncall:"apps-icm@ms.com",       mgr:"vp-apps@ms.com"},
  {id:"team-msg",       name:"Messaging Platform",  oncall:"msg-icm@ms.com",        mgr:"vp-msg@ms.com"},
  {id:"team-obs",       name:"Observability",       oncall:"obs-icm@ms.com",        mgr:"vp-ops@ms.com"},
];
const COMPONENTS = [
  // AAD
  {id:"comp-aadSTS",      name:"AAD STS",              type:"Auth Service",     service:"svc-aad",      version:"v8.2.0"},
  {id:"comp-aadGraph",    name:"MS Graph API",          type:"API",              service:"svc-aad",      version:"v1.0.19"},
  // Key Vault
  {id:"comp-kvHSM",       name:"Key Vault HSM",         type:"HSM",              service:"svc-keyvault", version:"v3.1.0"},
  {id:"comp-kvRP",        name:"Key Vault RP",          type:"Resource Provider",service:"svc-keyvault", version:"v2.4.1"},
  // Storage
  {id:"comp-storageRP",   name:"Storage RP",            type:"Resource Provider",service:"svc-storage",  version:"v3.8.0"},
  {id:"comp-storageFE",   name:"Storage Frontend",      type:"API Gateway",      service:"svc-storage",  version:"v4.12.1"},
  // SQL
  {id:"comp-sqlEngine",   name:"SQL Engine",            type:"Database",         service:"svc-sql",      version:"v16.0.4"},
  {id:"comp-sqlGW",       name:"SQL Gateway",           type:"Gateway",          service:"svc-sql",      version:"v2.3.1"},
  // Cosmos DB
  {id:"comp-cosmosRU",    name:"Cosmos RU Engine",      type:"Database",         service:"svc-cosmos",   version:"v4.3.1"},
  {id:"comp-cosmosGW",    name:"Cosmos Gateway",        type:"Gateway",          service:"svc-cosmos",   version:"v2.1.0"},
  // ADO
  {id:"comp-adoPipeline", name:"ADO Pipeline",          type:"Compute",          service:"svc-ado",      version:"v5.0.2"},
  {id:"comp-adoGit",      name:"ADO Git Service",       type:"VCS",              service:"svc-ado",      version:"v3.7.0"},
  // Container Registry
  {id:"comp-acrRegistry", name:"ACR Registry",          type:"Registry",         service:"svc-acr",      version:"v2.8.1"},
  {id:"comp-acrGeo",      name:"ACR Geo-Replication",   type:"Replication",      service:"svc-acr",      version:"v1.4.0"},
  // AKS
  {id:"comp-aksCP",       name:"AKS Control Plane",     type:"Control Plane",    service:"svc-aks",      version:"v1.28.5"},
  {id:"comp-aksNodepool", name:"AKS Node Pool",         type:"Compute",          service:"svc-aks",      version:"v1.28.5"},
  // Redis
  {id:"comp-redisCluster",name:"Redis Cluster",         type:"Cache",            service:"svc-redis",    version:"v7.2.0"},
  {id:"comp-redisGW",     name:"Redis Gateway",         type:"Gateway",          service:"svc-redis",    version:"v2.0.3"},
  // Load Balancer
  {id:"comp-lbFrontend",  name:"LB Frontend IP",        type:"Frontend",         service:"svc-lb",       version:"v3.1.0"},
  {id:"comp-lbBackend",   name:"LB Backend Pool",       type:"Backend",          service:"svc-lb",       version:"v3.1.0"},
  // App Service
  {id:"comp-appPlan",     name:"App Service Plan",      type:"Compute",          service:"svc-appSvc",   version:"v6.1.2"},
  {id:"comp-appGW",       name:"App Gateway",           type:"Gateway",          service:"svc-appSvc",   version:"v2.9.0"},
  // Functions
  {id:"comp-funcHost",    name:"Functions Host",        type:"Runtime",          service:"svc-functions",version:"v4.0.5"},
  {id:"comp-funcScaler",  name:"Functions Scaler",      type:"Autoscaler",       service:"svc-functions",version:"v2.1.3"},
  // Logic Apps
  {id:"comp-logicEngine", name:"Logic Apps Engine",     type:"Workflow Engine",  service:"svc-logicapps",version:"v3.0.1"},
  {id:"comp-logicConn",   name:"Logic Apps Connector",  type:"Connector",        service:"svc-logicapps",version:"v2.5.0"},
  // Event Hub
  {id:"comp-evhubNS",     name:"Event Hub Namespace",   type:"Namespace",        service:"svc-evhub",    version:"v2.0.5"},
  {id:"comp-evhubBroker", name:"Event Hub Broker",      type:"Broker",           service:"svc-evhub",    version:"v1.8.3"},
  // Service Bus
  {id:"comp-svcbusNS",    name:"Service Bus Namespace", type:"Namespace",        service:"svc-svcbus",   version:"v1.9.2"},
  {id:"comp-svcbusBroker",name:"Service Bus Broker",    type:"Broker",           service:"svc-svcbus",   version:"v1.6.1"},
  // API Management
  {id:"comp-apimGW",      name:"APIM Gateway",          type:"API Gateway",      service:"svc-apim",     version:"v5.3.0"},
  {id:"comp-apimPortal",  name:"APIM Developer Portal", type:"Portal",           service:"svc-apim",     version:"v4.1.2"},
  // CDN
  {id:"comp-cdnPOP",      name:"CDN Point of Presence", type:"Edge Node",        service:"svc-cdn",      version:"v8.0.1"},
  {id:"comp-cdnOrigin",   name:"CDN Origin Shield",     type:"Cache Layer",      service:"svc-cdn",      version:"v3.2.0"},
  // Monitor
  {id:"comp-monAlert",    name:"Monitor Alert Engine",  type:"Alert Engine",     service:"svc-monitor",  version:"v4.2.1"},
  {id:"comp-logAnalytics",name:"Log Analytics",         type:"Analytics",        service:"svc-monitor",  version:"v7.0.0"},
];
const SERVICE_DEPS = [
  // AAD is root — everything auth-gates through it
  ["svc-aad",      "svc-keyvault", "DEPENDS_ON"],
  ["svc-ado",      "svc-aad",      "DEPENDS_ON"],
  ["svc-aks",      "svc-aad",      "DEPENDS_ON"],
  ["svc-appSvc",   "svc-aad",      "DEPENDS_ON"],
  ["svc-functions","svc-aad",      "DEPENDS_ON"],
  ["svc-apim",     "svc-aad",      "DEPENDS_ON"],
  ["svc-cosmos",   "svc-aad",      "DEPENDS_ON"],
  ["svc-redis",    "svc-aad",      "DEPENDS_ON"],
  // Key Vault dependency chain
  ["svc-storage",  "svc-keyvault", "DEPENDS_ON"],
  ["svc-sql",      "svc-keyvault", "DEPENDS_ON"],
  ["svc-evhub",    "svc-keyvault", "DEPENDS_ON"],
  ["svc-svcbus",   "svc-keyvault", "DEPENDS_ON"],
  ["svc-appSvc",   "svc-keyvault", "DEPENDS_ON"],
  ["svc-functions","svc-keyvault", "DEPENDS_ON"],
  ["svc-aks",      "svc-keyvault", "DEPENDS_ON"],
  // Storage dependencies
  ["svc-appSvc",   "svc-storage",  "DEPENDS_ON"],
  ["svc-ado",      "svc-storage",  "DEPENDS_ON"],
  ["svc-functions","svc-storage",  "DEPENDS_ON"],
  ["svc-logicapps","svc-storage",  "DEPENDS_ON"],
  ["svc-cdn",      "svc-storage",  "READS_FROM"],
  // SQL / Cosmos dependencies
  ["svc-appSvc",   "svc-sql",      "DEPENDS_ON"],
  ["svc-ado",      "svc-sql",      "DEPENDS_ON"],
  ["svc-appSvc",   "svc-cosmos",   "DEPENDS_ON"],
  ["svc-functions","svc-cosmos",   "DEPENDS_ON"],
  // Containers
  ["svc-aks",      "svc-acr",      "DEPENDS_ON"],
  ["svc-ado",      "svc-acr",      "DEPENDS_ON"],
  // Redis caching layer
  ["svc-appSvc",   "svc-redis",    "DEPENDS_ON"],
  ["svc-functions","svc-redis",    "DEPENDS_ON"],
  ["svc-apim",     "svc-redis",    "DEPENDS_ON"],
  // Messaging
  ["svc-logicapps","svc-svcbus",   "DEPENDS_ON"],
  ["svc-functions","svc-evhub",    "DEPENDS_ON"],
  // Networking
  ["svc-appSvc",   "svc-lb",       "DEPENDS_ON"],
  ["svc-aks",      "svc-lb",       "DEPENDS_ON"],
  ["svc-apim",     "svc-lb",       "DEPENDS_ON"],
  // Monitor reads from everything
  ["svc-monitor",  "svc-storage",  "READS_FROM"],
  ["svc-monitor",  "svc-evhub",    "READS_FROM"],
  ["svc-monitor",  "svc-svcbus",   "READS_FROM"],
  ["svc-monitor",  "svc-aks",      "READS_FROM"],
];

// ═══════════════════════════════════════════════════════════════════
// GENERATED DATA — 60 CRs + 18 TSGs + 400 INCIDENTS
// ═══════════════════════════════════════════════════════════════════
function seededRand(seed) {
  let s = seed;
  return () => { s=(s*9301+49297)%233280; return s/233280; };
}
const R = seededRand(42);
const pick = (arr) => arr[Math.floor(R()*arr.length)];
const rInt = (a,b) => a+Math.floor(R()*(b-a+1));

const CR_TEMPLATES = [
  // AAD
  {title:"AAD STS cert rotation — quarterly renewal",          comp:"comp-aadSTS",      risk:"High",  type:"Cert"},
  {title:"AAD STS — TLS cipher suite hardening",               comp:"comp-aadSTS",      risk:"High",  type:"Security"},
  {title:"MS Graph API — rate limit policy update",            comp:"comp-aadGraph",    risk:"Medium",type:"Config"},
  // Key Vault
  {title:"Key Vault HSM firmware upgrade",                     comp:"comp-kvHSM",       risk:"High",  type:"Firmware"},
  {title:"Key Vault RP — RBAC model migration",                comp:"comp-kvRP",        risk:"High",  type:"Migration"},
  // Storage
  {title:"Storage RP — connection pool resize",                comp:"comp-storageRP",   risk:"Medium",type:"Config"},
  {title:"Storage Frontend — nginx config update",             comp:"comp-storageFE",   risk:"Low",   type:"Config"},
  {title:"Storage RP — TLS 1.3 enforcement",                   comp:"comp-storageRP",   risk:"High",  type:"Security"},
  // SQL
  {title:"SQL Engine — memory allocation tuning",              comp:"comp-sqlEngine",   risk:"Medium",type:"Config"},
  {title:"SQL Gateway — TLS 1.3 enforcement rollout",          comp:"comp-sqlGW",       risk:"High",  type:"Security"},
  {title:"SQL Gateway — connection retry policy update",       comp:"comp-sqlGW",       risk:"Medium",type:"Config"},
  {title:"SQL Engine — query plan cache clear",                comp:"comp-sqlEngine",   risk:"Low",   type:"Maintenance"},
  // Cosmos DB
  {title:"Cosmos RU Engine — throughput rebalancing",          comp:"comp-cosmosRU",    risk:"Medium",type:"Capacity"},
  {title:"Cosmos Gateway — consistency level migration",       comp:"comp-cosmosGW",    risk:"High",  type:"Migration"},
  {title:"Cosmos RU Engine — index policy update",             comp:"comp-cosmosRU",    risk:"Medium",type:"Config"},
  // ADO
  {title:"ADO Pipeline — agent pool scaling policy",           comp:"comp-adoPipeline", risk:"Medium",type:"Config"},
  {title:"ADO Git — pack file compaction maintenance",         comp:"comp-adoGit",      risk:"Low",   type:"Maintenance"},
  {title:"ADO Pipeline — task runtime upgrade",                comp:"comp-adoPipeline", risk:"High",  type:"Upgrade"},
  // ACR
  {title:"ACR Registry — geo-replication zone add",           comp:"comp-acrRegistry", risk:"Medium",type:"Capacity"},
  {title:"ACR Geo-Replication — failover policy update",      comp:"comp-acrGeo",      risk:"High",  type:"Config"},
  // AKS
  {title:"AKS Control Plane — version upgrade 1.27→1.28",     comp:"comp-aksCP",       risk:"High",  type:"Upgrade"},
  {title:"AKS Node Pool — spot instance policy change",        comp:"comp-aksNodepool", risk:"Medium",type:"Config"},
  {title:"AKS Control Plane — RBAC policy enforcement",        comp:"comp-aksCP",       risk:"High",  type:"Security"},
  // Redis
  {title:"Redis Cluster — shard rebalancing",                  comp:"comp-redisCluster",risk:"High",  type:"Maintenance"},
  {title:"Redis Gateway — connection limit tuning",            comp:"comp-redisGW",     risk:"Medium",type:"Config"},
  // Load Balancer
  {title:"LB Frontend — health probe interval change",         comp:"comp-lbFrontend",  risk:"Medium",type:"Config"},
  {title:"LB Backend Pool — drain policy update",              comp:"comp-lbBackend",   risk:"Low",   type:"Config"},
  // App Service
  {title:"App Service Plan — worker memory limit increase",    comp:"comp-appPlan",     risk:"Low",   type:"Config"},
  {title:"App Gateway — WAF rule set update",                  comp:"comp-appGW",       risk:"Medium",type:"Security"},
  {title:"App Service Plan — autoscale threshold tuning",      comp:"comp-appPlan",     risk:"Medium",type:"Config"},
  // Functions
  {title:"Functions Host — runtime upgrade v3→v4",             comp:"comp-funcHost",    risk:"High",  type:"Upgrade"},
  {title:"Functions Scaler — concurrency limit increase",      comp:"comp-funcScaler",  risk:"Medium",type:"Config"},
  // Logic Apps
  {title:"Logic Apps Engine — workflow runtime upgrade",       comp:"comp-logicEngine", risk:"High",  type:"Upgrade"},
  {title:"Logic Apps Connector — OAuth token refresh policy",  comp:"comp-logicConn",   risk:"Medium",type:"Config"},
  // Event Hub
  {title:"Event Hub Namespace — partition count scale-up",     comp:"comp-evhubNS",     risk:"Medium",type:"Capacity"},
  {title:"Event Hub Broker — consumer group limit increase",   comp:"comp-evhubBroker", risk:"Low",   type:"Config"},
  {title:"Event Hub Namespace — geo-redundancy failover test", comp:"comp-evhubNS",     risk:"High",  type:"Test"},
  // Service Bus
  {title:"Service Bus Namespace — premium tier migration",     comp:"comp-svcbusNS",    risk:"High",  type:"Migration"},
  {title:"Service Bus Broker — dead-letter queue policy",      comp:"comp-svcbusBroker",risk:"Low",   type:"Config"},
  // APIM
  {title:"APIM Gateway — TLS policy enforcement",              comp:"comp-apimGW",      risk:"High",  type:"Security"},
  {title:"APIM Developer Portal — identity provider update",   comp:"comp-apimPortal",  risk:"Medium",type:"Config"},
  // CDN
  {title:"CDN POP — cache invalidation rule update",           comp:"comp-cdnPOP",      risk:"Low",   type:"Config"},
  {title:"CDN Origin Shield — compression policy change",      comp:"comp-cdnOrigin",   risk:"Low",   type:"Config"},
  // Monitor
  {title:"Monitor Alert Engine — rule evaluation interval",    comp:"comp-monAlert",    risk:"Low",   type:"Config"},
  {title:"Log Analytics — retention policy update",            comp:"comp-logAnalytics",risk:"Low",   type:"Config"},
  {title:"Monitor Alert Engine — suppression window fix",      comp:"comp-monAlert",    risk:"Medium",type:"Bugfix"},
];
const AUTHORS = ["jsmith@ms.com","alee@ms.com","rrao@ms.com","mchen@ms.com","tpatel@ms.com",
  "kwong@ms.com","bpark@ms.com","snguyen@ms.com","dgonzalez@ms.com","fmüller@ms.com"];

const CHANGE_REQUESTS = Array.from({length:60},(_,i)=>{
  const tpl = CR_TEMPLATES[i % CR_TEMPLATES.length];
  const daysAgo = rInt(1,180);
  const d = new Date("2025-03-06T12:00:00Z");
  d.setDate(d.getDate()-daysAgo);
  return {
    id:`CR-${9930-i*3}`, title:tpl.title, type:tpl.type,
    status:"Deployed", author:pick(AUTHORS),
    deployedAt:d.toISOString(), risk:tpl.risk,
    component:tpl.comp,
  };
});

const TSG_TEMPLATES = [
  {id:"TSG-441",title:"Storage RP — Connection Pool Exhaustion",       service:"svc-storage",   successRate:94,avgTTR:"25 min",
   steps:["Check StorageRP metrics → pool utilization","Run KQL: StorageRPMetrics | where PoolUtilization > 90","Scale pool via ARM: minPoolSize, maxPoolSize","Monitor 15min, validate P99 < 50ms"]},
  {id:"TSG-382",title:"AAD STS — Certificate Chain Validation Failure", service:"svc-aad",      successRate:89,avgTTR:"45 min",
   steps:["Validate cert thumbprint in AAD portal","Check expiry: az ad sp credential list","Trigger refresh: POST /certificates/refresh","Clear STS cache cluster-wide","Validate via Graph Explorer"]},
  {id:"TSG-319",title:"SQL Gateway — TLS Handshake Timeout Cascade",   service:"svc-sql",       successRate:82,avgTTR:"62 min",
   steps:["Identify region in SQL GW dashboard","Check TLS negotiation errors in gateway logs","Roll back TLS policy via feature flag","Drain and restart gateway nodes","Re-enable with corrected cipher list"]},
  {id:"TSG-309",title:"Cosmos DB — RU Throttling Under Spike Load",     service:"svc-cosmos",   successRate:88,avgTTR:"30 min",
   steps:["Check RU consumption in Azure portal → Metrics → Total RUs","Identify hot partition via partition key stats","Temporarily increase provisioned RU via ARM","Enable autoscale if not active","Review partition key design offline"]},
  {id:"TSG-301",title:"AKS Control Plane — Upgrade Rollback",           service:"svc-aks",      successRate:85,avgTTR:"55 min",
   steps:["Check kubectl get nodes — identify NotReady nodes","Review kube-apiserver logs for upgrade errors","Initiate rollback: az aks upgrade --kubernetes-version prev","Monitor node readiness","Validate workload pods are Running"]},
  {id:"TSG-288",title:"Event Hub — Partition Rebalancing During Scale",  service:"svc-evhub",   successRate:91,avgTTR:"35 min",
   steps:["Monitor consumer group lag in EH Metrics","Pause consumers in rolling fashion","Verify partition assignment via EH Explorer","Resume consumers gradually"]},
  {id:"TSG-279",title:"Redis Cluster — Shard Rebalancing Timeout",      service:"svc-redis",    successRate:87,avgTTR:"40 min",
   steps:["Check Redis cluster info — node shard distribution","Identify overloaded shard via CLUSTER NODES","Trigger manual rebalancing: CLUSTER REBALANCE","Monitor keyspace hits and misses","Validate P99 latency < 2ms"]},
  {id:"TSG-271",title:"App Service — 503s from Downstream SQL Timeout", service:"svc-appSvc",   successRate:88,avgTTR:"41 min",
   steps:["Check health probes — identify unhealthy workers","Trace SQL via App Insights dependency view","Increase SQL command timeout","Restart worker pool","Validate with synthetic monitor"]},
  {id:"TSG-265",title:"Functions Host — Cold Start Latency Spike",      service:"svc-functions",successRate:83,avgTTR:"28 min",
   steps:["Check Functions host metrics — invocation cold start %","Enable Always-On if consumption plan","Increase pre-warmed instance count","Verify storage account accessibility (trigger source)","Monitor cold start p95 in App Insights"]},
  {id:"TSG-258",title:"Service Bus — Dead-Letter Queue Overflow",        service:"svc-svcbus",   successRate:92,avgTTR:"20 min",
   steps:["Check DLQ depth in Service Bus Explorer","Identify poison message pattern in DLQ properties","Purge invalid messages: Service Bus Explorer → Purge","Restart consumer with retry policy fix","Validate throughput restored"]},
  {id:"TSG-255",title:"Key Vault HSM — Failover Latency Spike",         service:"svc-keyvault", successRate:92,avgTTR:"22 min",
   steps:["Check HSM primary/secondary replication lag","Trigger manual failover if lag > 30s","Validate secret retrieval P99 < 100ms","Update DNS TTL for new primary"]},
  {id:"TSG-248",title:"APIM Gateway — Backend Timeout Cascade",         service:"svc-apim",     successRate:86,avgTTR:"33 min",
   steps:["Check APIM gateway logs — identify slow backend","Adjust backend timeout policy in APIM XML","Enable circuit breaker policy for degraded backend","Test with APIM test console","Restore full routing after backend recovery"]},
  {id:"TSG-241",title:"ACR — Geo-Replication Sync Failure",             service:"svc-acr",      successRate:90,avgTTR:"45 min",
   steps:["Check ACR geo-replication status in portal","Identify failed replica regions","Force manual sync: az acr replication update --sync","Validate image pulls from affected region","Alert AKS clusters using affected registry"]},
  {id:"TSG-234",title:"ADO Pipeline — Agent Pool Exhaustion",           service:"svc-ado",      successRate:96,avgTTR:"18 min",
   steps:["Check agent pool utilization in ADO settings","Scale out pool via VMSS capacity increase","Cancel stuck pipeline runs older than 4h","Monitor queue depth until < 10"]},
  {id:"TSG-227",title:"Load Balancer — Health Probe Failure Loop",      service:"svc-lb",       successRate:94,avgTTR:"15 min",
   steps:["Check LB health probe status in Azure portal","Identify unhealthy backend instances","Verify probe endpoint responds correctly","Adjust probe interval if causing flap","Drain and restore affected backends"]},
  {id:"TSG-221",title:"Azure Monitor — Alert Evaluation Backlog",       service:"svc-monitor",  successRate:85,avgTTR:"33 min",
   steps:["Check Alert Engine queue depth via /metrics","Restart alert workers in affected region","Verify rule evaluation timestamps","Force backlog flush: POST /alerts/flush"]},
  {id:"TSG-214",title:"Logic Apps — Connector Auth Token Expiry",       service:"svc-logicapps",successRate:89,avgTTR:"22 min",
   steps:["Identify failed runs in Logic Apps monitor","Check connector OAuth token expiry","Re-authorize connector in designer","Update managed identity if using MSI auth","Re-trigger failed runs"]},
  {id:"TSG-208",title:"Storage Frontend — Nginx Worker OOM Crash",      service:"svc-storage",  successRate:90,avgTTR:"15 min",
   steps:["Check dmesg for OOM killer events","Increase worker_connections in nginx.conf","Rolling restart of nginx workers","Validate upstream connection count"]},
  {id:"TSG-195",title:"MS Graph API — Throttling Under High Load",      service:"svc-aad",      successRate:78,avgTTR:"55 min",
   steps:["Identify tenant(s) exceeding Graph API limits","Apply per-tenant throttle exemption for P0","Enable request queuing with exponential backoff","Coordinate with tenant for traffic shaping"]},
];
const TSGS = TSG_TEMPLATES;

// Incident templates per service — 18 services
const INC_TEMPLATES = {
  "svc-aad":[
    {title:"Azure AD — Auth Token Issuance Failures",      comp:"comp-aadSTS",      err:"AADSTS700016",            impact:"SSO failures across M365 and Azure Portal"},
    {title:"AAD STS — Certificate Chain Mismatch",         comp:"comp-aadSTS",      err:"AADSTS700027",            impact:"Token signing validation failures — 23% of auth requests rejected"},
    {title:"MS Graph API — Throttling Cascade",            comp:"comp-aadGraph",    err:"429 TooManyRequests",     impact:"Graph API calls throttled — downstream apps failing"},
    {title:"AAD — Conditional Access Policy Loop",         comp:"comp-aadSTS",      err:"AADSTS53003",             impact:"MFA loop for enterprise tenants — users locked out"},
    {title:"AAD — SAML Token Signing Failure",             comp:"comp-aadSTS",      err:"AADSTS700012",            impact:"SAML-based SSO broken for federated tenants"},
  ],
  "svc-keyvault":[
    {title:"Key Vault HSM — Failover Latency Spike",       comp:"comp-kvHSM",       err:"KeyVaultError-HSMTimeout",impact:"Secret retrieval P99 > 8s — apps timing out on startup"},
    {title:"Key Vault — Secret Rotation Failure",          comp:"comp-kvRP",        err:"SecretRotationFailed",    impact:"Automated secret rotation stalled — expiry risk"},
    {title:"Key Vault — Access Policy Propagation Delay",  comp:"comp-kvRP",        err:"Forbidden-403",           impact:"New app identities unable to access secrets after RBAC grant"},
    {title:"Key Vault — Certificate Auto-Renewal Stuck",   comp:"comp-kvHSM",       err:"CertRenewalFailed",       impact:"SSL certificates nearing expiry — manual intervention needed"},
  ],
  "svc-storage":[
    {title:"Azure Storage Latency Spike",                  comp:"comp-storageRP",   err:"StorageRequestFailed-503",impact:"Elevated blob read latency P99 > 4s"},
    {title:"Storage Blob — 503 Connection Pool Exhaustion",comp:"comp-storageRP",   err:"StorageConnPool-Exhausted",impact:"App Service tenants seeing blob 503s"},
    {title:"Azure Files — SMB Mount Failures",             comp:"comp-storageFE",   err:"SMBMountFailed-53",       impact:"Azure Files shares unmountable from VMs"},
    {title:"Storage RP — Throttling on PUT Operations",    comp:"comp-storageRP",   err:"ThrottlingError-429",     impact:"Batch upload jobs failing with throttle errors"},
    {title:"Storage Frontend — Nginx Worker OOM",          comp:"comp-storageFE",   err:"OOMKiller-nginx",         impact:"Storage frontend crashes — intermittent 502s"},
  ],
  "svc-sql":[
    {title:"Azure SQL — TLS Handshake Timeout Cascade",    comp:"comp-sqlGW",       err:"SSL_ERROR_HANDSHAKE_FAILURE",impact:"CI/CD pipeline SQL checks failing — connection pool exhaustion"},
    {title:"SQL DB — Deadlock Storm on High-Traffic Table",comp:"comp-sqlEngine",   err:"SQL-1205-Deadlock",       impact:"Transaction rollbacks affecting financial reporting jobs"},
    {title:"Azure SQL Elastic Pool — DTU Cap Hit",         comp:"comp-sqlEngine",   err:"ResourceGovernorLimit",   impact:"Query timeouts across all elastic pool databases"},
    {title:"SQL Gateway — Memory Pressure OOM",            comp:"comp-sqlGW",       err:"SQLGateway-OOM",          impact:"Gateway process crash — connection reset on all clients"},
    {title:"Azure SQL — Replication Lag > 30s",            comp:"comp-sqlEngine",   err:"SQLReplicationLag",       impact:"Read replicas serving stale data — reporting discrepancies"},
  ],
  "svc-cosmos":[
    {title:"Cosmos DB — RU Throttling on Hot Partition",   comp:"comp-cosmosRU",    err:"CosmosDB-429-TooManyRequests",impact:"Document writes throttled — application backpressure accumulating"},
    {title:"Cosmos DB — Replication Lag > 5s",             comp:"comp-cosmosRU",    err:"CosmosDB-ConsistencyViolation",impact:"Multi-region reads returning stale data — financial integrity risk"},
    {title:"Cosmos Gateway — TLS Handshake Failure",       comp:"comp-cosmosGW",    err:"CosmosGW-TLS-Error",      impact:"SDK connections failing — apps unable to connect to Cosmos"},
    {title:"Cosmos DB — Index Policy Rebuild Timeout",     comp:"comp-cosmosRU",    err:"CosmosDB-IndexBuildTimeout",impact:"Queries returning full scans — 100× latency increase"},
  ],
  "svc-ado":[
    {title:"Azure DevOps — Pipeline Execution Failures",   comp:"comp-adoPipeline", err:"PipelineAgentUnreachable",impact:"CI/CD pipelines queued — no available agents"},
    {title:"ADO — Artifact Feed Unavailable",              comp:"comp-adoPipeline", err:"NuGet-503",               impact:"Package restore failures blocking all builds"},
    {title:"Azure DevOps — Git Push Timeout",              comp:"comp-adoGit",      err:"GitPackTimeout",          impact:"Large repo pushes timing out — developers blocked"},
    {title:"ADO — Work Item Query Service Degradation",    comp:"comp-adoGit",      err:"WIQLTimeout",             impact:"Work item boards loading slowly — PM productivity impacted"},
    {title:"Azure DevOps — Test Runner Memory Leak",       comp:"comp-adoPipeline", err:"TestAgent-OOM",           impact:"Test pipeline agents crashing mid-run — flaky test signals"},
  ],
  "svc-acr":[
    {title:"ACR — Image Pull Failures East US",            comp:"comp-acrRegistry", err:"ACR-ManifestNotFound",    impact:"AKS pods failing to pull images — deployment rollouts blocked"},
    {title:"ACR — Geo-Replication Sync Lag > 10min",       comp:"comp-acrGeo",      err:"ACR-GeoSyncTimeout",      impact:"Cross-region image availability degraded — DR runbooks at risk"},
    {title:"ACR — Push Rate Limit Exceeded",               comp:"comp-acrRegistry", err:"ACR-RateLimitExceeded",   impact:"CI pipeline image pushes rejected — build artifacts lost"},
  ],
  "svc-aks":[
    {title:"AKS — Control Plane API Server Unavailable",   comp:"comp-aksCP",       err:"AKS-APIServerTimeout",    impact:"kubectl commands timing out — deployments and rollbacks frozen"},
    {title:"AKS — Node Pool OOM Eviction Storm",           comp:"comp-aksNodepool", err:"AKS-OOMEviction",         impact:"Pods evicted across multiple nodes — service disruption"},
    {title:"AKS — Upgrade Version Skew Crash",             comp:"comp-aksCP",       err:"AKS-VersionSkewError",    impact:"Mixed node versions causing scheduler failures"},
    {title:"AKS — CoreDNS Resolution Failures",            comp:"comp-aksCP",       err:"AKS-DNSResolutionFailure",impact:"Inter-pod service discovery broken — microservices can't connect"},
  ],
  "svc-redis":[
    {title:"Redis — Cluster Shard Rebalancing Timeout",    comp:"comp-redisCluster",err:"Redis-CLUSTERDOWN",        impact:"Cache unavailable during rebalancing — DB hit rate spikes 10×"},
    {title:"Redis — Memory Eviction Storm",                comp:"comp-redisCluster",err:"Redis-OOM-MaxMemory",      impact:"Hot keys evicted — session data lost for ~5% active users"},
    {title:"Redis Gateway — Connection Pool Exhaustion",   comp:"comp-redisGW",     err:"Redis-ConnPool-Exhausted", impact:"App connections queued — latency spike P99 > 2s"},
  ],
  "svc-lb":[
    {title:"Load Balancer — Health Probe False Positives", comp:"comp-lbFrontend",  err:"LB-HealthProbeFailure",    impact:"Healthy backends drained — traffic concentrated on 30% of fleet"},
    {title:"LB — Backend Pool Drain During Deployment",   comp:"comp-lbBackend",   err:"LB-BackendDrainTimeout",   impact:"Zero-downtime deployment stalled — old pods receiving traffic"},
    {title:"Azure LB — SNAT Port Exhaustion",             comp:"comp-lbFrontend",  err:"LB-SNATPortExhausted",     impact:"Outbound connections failing — AKS pods unable to reach internet"},
  ],
  "svc-appSvc":[
    {title:"App Service — 503 Errors on Downstream SQL",  comp:"comp-appPlan",     err:"UpstreamConnectionFailure",impact:"App Service apps returning 503 on DB-bound requests"},
    {title:"Azure App Service — Worker Process Crashes",   comp:"comp-appPlan",     err:"WorkerProcess-5xx",        impact:"Web apps returning 5xx — worker recycling loop"},
    {title:"App Service — Deployment Slot Swap Hung",      comp:"comp-appGW",       err:"SlotSwapTimeout",          impact:"Blue/green deployments blocked — rollback not possible"},
    {title:"App Service — SSL Cert Binding Failure",       comp:"comp-appGW",       err:"SNI-BindingFailed",        impact:"Custom domain HTTPS broken after cert renewal"},
    {title:"App Service — Autoscale Not Triggering",       comp:"comp-appPlan",     err:"AutoscaleDecisionDelay",   impact:"Traffic spike absorbing all instances — high error rate"},
  ],
  "svc-functions":[
    {title:"Functions — Cold Start Spike > 30s",           comp:"comp-funcHost",    err:"Functions-ColdStartTimeout",impact:"First invocations timing out — event-driven workflows stalling"},
    {title:"Functions — Scale-Out Failure on Burst",       comp:"comp-funcScaler",  err:"Functions-ScaleOutFailed", impact:"Event queue backlog growing — SLA breach in 15min"},
    {title:"Functions — Storage Trigger Polling Lag",      comp:"comp-funcHost",    err:"Functions-StorageTriggerLag",impact:"Blob-triggered functions delayed 10–20min — batch pipelines impacted"},
  ],
  "svc-logicapps":[
    {title:"Logic Apps — OAuth Token Expiry Loop",         comp:"comp-logicConn",   err:"LogicApps-AuthExpired",    impact:"Automated workflows paused — IT approval workflows broken"},
    {title:"Logic Apps — Connector Timeout on Large Payload",comp:"comp-logicEngine",err:"LogicApps-PayloadOverflow",impact:"File processing workflows failing on payloads > 100MB"},
    {title:"Logic Apps — Trigger Recurrence Drift",        comp:"comp-logicEngine", err:"LogicApps-RecurrenceDrift",impact:"Scheduled workflows running late by up to 45min"},
  ],
  "svc-evhub":[
    {title:"Azure Event Hub — Throughput Degradation",     comp:"comp-evhubNS",     err:"EventHubThrottlingException",impact:"Consumer group lag accumulating — message delivery delay >90s"},
    {title:"Event Hub — Partition Rebalancing Storm",      comp:"comp-evhubNS",     err:"PartitionRebalanceTimeout",  impact:"Consumer disconnections during namespace scale-up"},
    {title:"Event Hub Broker — Message Loss on Failover",  comp:"comp-evhubBroker", err:"MessageLoss-GeoFailover",    impact:"~0.02% message loss during regional failover test"},
    {title:"Event Hub — Namespace Quota Exceeded",         comp:"comp-evhubNS",     err:"QuotaExceeded-NamespaceUnits",impact:"New connections rejected — active producers failing"},
  ],
  "svc-svcbus":[
    {title:"Service Bus — Dead-Letter Queue Overflow",     comp:"comp-svcbusNS",    err:"ServiceBus-DLQOverflow",    impact:"Poison messages blocking topic subscriptions — workflows stalled"},
    {title:"Service Bus — Namespace Throttling",           comp:"comp-svcbusBroker",err:"ServiceBus-ThrottlingError",impact:"Message send rate capped — order processing queued"},
    {title:"Service Bus — Session Lock Expiry Storm",      comp:"comp-svcbusBroker",err:"ServiceBus-SessionLockLost",impact:"Competing consumers stealing sessions — duplicate processing risk"},
  ],
  "svc-apim":[
    {title:"APIM Gateway — Backend Circuit Breaker Open",  comp:"comp-apimGW",      err:"APIM-BackendUnhealthy",     impact:"All API traffic failing with 503 — 100% error rate"},
    {title:"APIM — Rate Limit Policy Misconfiguration",    comp:"comp-apimGW",      err:"APIM-RateLimitBreach",      impact:"High-value tenants throttled incorrectly — SLA breach"},
    {title:"APIM Developer Portal — Identity Login Broken",comp:"comp-apimPortal",  err:"APIM-Portal-OIDCFailed",   impact:"External developers unable to test APIs — partner escalation"},
  ],
  "svc-cdn":[
    {title:"CDN — Cache Purge Propagation Delay",          comp:"comp-cdnPOP",      err:"CDN-PurgeTimeout",          impact:"Stale content served after deployment — 5% of users seeing old UI"},
    {title:"CDN — Origin Shield SSL Negotiation Failure",  comp:"comp-cdnOrigin",   err:"CDN-OriginSSLError",        impact:"CDN unable to fetch from origin — all requests returning 502"},
    {title:"CDN POP — Traffic Spike Causing Eviction",     comp:"comp-cdnPOP",      err:"CDN-CacheEviction",         impact:"Cache hit ratio drops to 20% — origin overloaded"},
  ],
  "svc-monitor":[
    {title:"Azure Monitor — Alert Processing Delay > 10min",comp:"comp-monAlert",   err:"AlertEvalBacklog",          impact:"Critical alerts firing 10-45min late — SLO at risk"},
    {title:"Monitor — Log Analytics Ingestion Lag",        comp:"comp-logAnalytics",err:"IngestionLag",              impact:"Dashboards showing stale data — oncall missing signals"},
    {title:"Azure Monitor — Metric Query Failures",        comp:"comp-monAlert",    err:"MetricStoreUnavailable",    impact:"Azure portal metric charts blank — troubleshooting impaired"},
  ],
};

const REGIONS = ["East US","East US 2","West US 2","North EU","Southeast Asia","UK South","Australia East","Japan East"];
const STATUS_WEIGHTS = ["Resolved","Resolved","Resolved","Resolved","Resolved","Resolved","Resolved","Resolved","Mitigating","Active"];
const SEV_WEIGHTS = ["Sev4","Sev4","Sev3","Sev3","Sev3","Sev2","Sev2","Sev1","Sev2","Sev0"];
const MTTR_BY_SEV = {Sev0:[180,480],Sev1:[60,180],Sev2:[20,90],Sev3:[10,60],Sev4:[5,30]};

function generateIncidents() {
  const R2 = seededRand(7);
  const p2 = (arr) => arr[Math.floor(R2()*arr.length)];
  const ri2 = (a,b) => a+Math.floor(R2()*(b-a+1));

  const svcIds = SERVICES.map(s=>s.id);
  const anchors = [
    {id:"INC-2847",title:"Azure Storage Latency Spike — East US 2",severity:"Sev2",status:"Resolved",
     affectedServices:["svc-storage","svc-appSvc"],rootComponent:"comp-storageRP",triggeredBy:"CR-9921",resolvedBy:"TSG-441",
     errorCode:"StorageRequestFailed-503",customerImpact:"~12,000 customers — elevated latency P99 >4s on blob read ops",
     summary:"Connection pool exhausted after CR-9921 set maxPoolSize too low.",
     createdAt:"2025-03-05T15:10:00Z",resolvedAt:"2025-03-05T15:48:00Z",mttr:"38 min",
     team:"team-storage",similarIncidents:["INC-2511","INC-2203"],region:"East US 2"},
    {id:"INC-2901",title:"Azure Active Directory — Auth Token Issuance Failures",severity:"Sev1",status:"Resolved",
     affectedServices:["svc-aad","svc-ado","svc-keyvault"],rootComponent:"comp-aadSTS",triggeredBy:"CR-9921",resolvedBy:"TSG-382",
     errorCode:"AADSTS700016",customerImpact:"~85,000 enterprise users — SSO failures across M365, Azure portal, DevOps",
     summary:"Cert rotation CR-9904 introduced chain mismatch. 23% of auth requests rejected.",
     createdAt:"2025-03-04T10:15:00Z",resolvedAt:"2025-03-04T11:42:00Z",mttr:"87 min",
     team:"team-aad",similarIncidents:["INC-2441","INC-1988"],region:"Global"},
    {id:"INC-3012",title:"Azure SQL — TLS Handshake Timeout Cascade",severity:"Sev2",status:"Resolved",
     affectedServices:["svc-sql","svc-appSvc","svc-ado"],rootComponent:"comp-sqlGW",triggeredBy:"CR-9887",resolvedBy:"TSG-319",
     errorCode:"SSL_ERROR_HANDSHAKE_FAILURE",customerImpact:"~31,000 developers — CI/CD SQL checks failing",
     summary:"TLS 1.3 rollout introduced cipher incompatibility with legacy JDBC drivers.",
     createdAt:"2025-03-03T12:05:00Z",resolvedAt:"2025-03-03T13:10:00Z",mttr:"65 min",
     team:"team-sql",similarIncidents:["INC-2788"],region:"East US"},
    {id:"INC-3156",title:"Azure App Service — 503 Errors on Dependent SQL Tier",severity:"Sev3",status:"Resolved",
     affectedServices:["svc-appSvc"],rootComponent:"comp-appPlan",triggeredBy:null,resolvedBy:"TSG-271",
     errorCode:"HTTP 503 — UpstreamConnectionFailure",customerImpact:"~8,200 customers — App Service 503s on DB requests",
     summary:"Downstream from INC-3012. Worker SQL pools exhausted during TLS fix window.",
     createdAt:"2025-03-03T12:30:00Z",resolvedAt:"2025-03-03T13:20:00Z",mttr:"50 min",
     team:"team-apps",similarIncidents:["INC-3012"],region:"West US 2"},
    {id:"INC-3204",title:"Azure Event Hub — Throughput Degradation North EU",severity:"Sev2",status:"Mitigating",
     affectedServices:["svc-evhub"],rootComponent:"comp-evhubNS",triggeredBy:"CR-9870",resolvedBy:null,
     errorCode:"EventHubThrottlingException — PartitionRebalance",customerImpact:"~4,400 customers — message delivery delay >90s",
     summary:"Partition scale-up CR-9870 triggered consumer group rebalance across all NS in North EU.",
     createdAt:"2025-03-06T08:00:00Z",resolvedAt:null,mttr:null,
     team:"team-msg",similarIncidents:["INC-2701"],region:"North EU"},
    // New anchors for expanded services
    {id:"INC-3310",title:"AKS Control Plane — API Server Unavailable West US 2",severity:"Sev1",status:"Resolved",
     affectedServices:["svc-aks","svc-acr","svc-aad"],rootComponent:"comp-aksCP",triggeredBy:"CR-9855",resolvedBy:"TSG-301",
     errorCode:"AKS-APIServerTimeout",customerImpact:"~18,000 developers — kubectl and deployments frozen for 62min",
     summary:"AKS 1.28 upgrade introduced control plane version skew. Rollback applied.",
     createdAt:"2025-03-02T07:30:00Z",resolvedAt:"2025-03-02T08:32:00Z",mttr:"62 min",
     team:"team-containers",similarIncidents:["INC-2901"],region:"West US 2"},
    {id:"INC-3401",title:"Cosmos DB — RU Throttling Cascade on Hot Partition",severity:"Sev2",status:"Resolved",
     affectedServices:["svc-cosmos","svc-functions","svc-appSvc"],rootComponent:"comp-cosmosRU",triggeredBy:"CR-9840",resolvedBy:"TSG-309",
     errorCode:"CosmosDB-429-TooManyRequests",customerImpact:"~22,000 customers — document writes throttled, app backpressure",
     summary:"Index policy change increased RU cost per write 3×. Hot partition exceeded provisioned throughput.",
     createdAt:"2025-02-28T14:20:00Z",resolvedAt:"2025-02-28T14:50:00Z",mttr:"30 min",
     team:"team-cosmos",similarIncidents:["INC-2847"],region:"East US"},
    {id:"INC-3488",title:"Redis Cache — Cluster Rebalancing Memory Eviction Storm",severity:"Sev2",status:"Resolved",
     affectedServices:["svc-redis","svc-appSvc","svc-functions"],rootComponent:"comp-redisCluster",triggeredBy:"CR-9830",resolvedBy:"TSG-279",
     errorCode:"Redis-OOM-MaxMemory",customerImpact:"~9,500 customers — session data lost, cache miss storm hitting SQL",
     summary:"Shard rebalancing CR triggered eviction storm. SQL hit rate spiked 10×.",
     createdAt:"2025-02-25T09:45:00Z",resolvedAt:"2025-02-25T10:25:00Z",mttr:"40 min",
     team:"team-cache",similarIncidents:["INC-3012"],region:"East US 2"},
  ];

  const generated = [];
  const allIds = anchors.map(a=>a.id);

  for (let i=0; i<392; i++) {
    const incNum = 1000 + i*7 + ri2(1,6);
    const id = `INC-${incNum}`;
    allIds.push(id);

    const svcId = p2(svcIds);
    const svc = SERVICES.find(s=>s.id===svcId);
    const tplList = INC_TEMPLATES[svcId] || INC_TEMPLATES["svc-storage"];
    const tpl = p2(tplList);
    const severity = p2(SEV_WEIGHTS);
    const status = p2(STATUS_WEIGHTS);
    const [mMin,mMax] = MTTR_BY_SEV[severity];
    const mttrMin = ri2(mMin,mMax);

    const daysAgo = ri2(1,180);
    const created = new Date("2025-03-06T12:00:00Z");
    created.setDate(created.getDate()-daysAgo);
    const resolved = status==="Resolved" ? new Date(created.getTime()+mttrMin*60000) : null;

    const hasCR = R2() < 0.6;
    const hasTSG = R2() < 0.8;
    const cr = hasCR ? p2(CHANGE_REQUESTS) : null;
    const tsgMatch = TSGS.filter(t=>t.service===svcId);
    const tsg = hasTSG ? (tsgMatch.length ? p2(tsgMatch) : p2(TSGS)) : null;

    const affCount = ri2(1,3);
    const affSvcs = [svcId];
    for(let k=1;k<affCount;k++){
      const dep = SERVICE_DEPS.filter(d=>d[0]===svcId||d[1]===svcId);
      if(dep.length){const d=p2(dep); const other=d[0]===svcId?d[1]:d[0]; if(!affSvcs.includes(other)) affSvcs.push(other);}
    }

    const simCount = ri2(0,3);
    const simIncs = [];
    const pool = [...anchors.map(a=>a.id), ...generated.map(g=>g.id)].filter(x=>x!==id);
    for(let k=0;k<simCount&&pool.length;k++){
      const s=p2(pool); if(!simIncs.includes(s)) simIncs.push(s);
    }

    const custNums = {Sev0:ri2(100000,500000),Sev1:ri2(10000,100000),Sev2:ri2(1000,30000),Sev3:ri2(100,5000),Sev4:ri2(10,500)};

    generated.push({
      id, title:`${tpl.title} — ${p2(REGIONS)}`,
      severity, status,
      createdAt:created.toISOString(),
      resolvedAt:resolved?resolved.toISOString():null,
      mttr:status==="Resolved"?`${mttrMin} min`:null,
      affectedServices:affSvcs,
      rootComponent:tpl.comp,
      triggeredBy:cr?cr.id:null,
      resolvedBy:tsg?tsg.id:null,
      errorCode:tpl.err,
      customerImpact:`~${custNums[severity].toLocaleString()} customers — ${tpl.impact}`,
      summary:`${tpl.impact}. Root component: ${tpl.comp}.${cr?` Triggered by ${cr.id}.`:""}${tsg?` Resolved using ${tsg.id}.`:""}`,
      team:svc.team,
      similarIncidents:simIncs,
      region:p2(REGIONS),
    });
  }
  return [...anchors, ...generated].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
}

const INCIDENTS = generateIncidents();

// Static positions — 18 services laid out in tier rows (viewBox 720×360)
const SVC_POSITIONS = {
  // Tier 0 — center top
  "svc-aad":      {x:360, y:45},
  // Tier 1 — 10 services
  "svc-keyvault": {x:60,  y:145},
  "svc-storage":  {x:130, y:145},
  "svc-sql":      {x:200, y:145},
  "svc-cosmos":   {x:270, y:145},
  "svc-ado":      {x:360, y:145},
  "svc-acr":      {x:430, y:145},
  "svc-aks":      {x:500, y:145},
  "svc-redis":    {x:570, y:145},
  "svc-lb":       {x:640, y:145},
  // Tier 2 — 8 services
  "svc-appSvc":   {x:60,  y:280},
  "svc-functions":{x:140, y:280},
  "svc-logicapps":{x:220, y:280},
  "svc-evhub":    {x:310, y:280},
  "svc-svcbus":   {x:390, y:280},
  "svc-apim":     {x:470, y:280},
  "svc-cdn":      {x:560, y:280},
  "svc-monitor":  {x:645, y:280},
};

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════
const fmt = (iso)=>iso?new Date(iso).toLocaleString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}):"—";
const ago = (iso)=>{
  const d=Math.floor((Date.now()-new Date(iso))/60000);
  if(d<60) return `${d}m ago`; if(d<1440) return `${Math.floor(d/60)}h ago`; return `${Math.floor(d/1440)}d ago`;
};
function Badge({label,color,bg,small}){
  return <span style={{background:bg,color,border:`1px solid ${color}40`,fontFamily:"'DM Mono',monospace",fontSize:small?9:10,fontWeight:500,padding:small?"1px 5px":"2px 7px",borderRadius:3,letterSpacing:0.5,whiteSpace:"nowrap"}}>{label}</span>;
}
function SevBadge({sev,small}){const s=SEV[sev]||SEV.Sev4;return <Badge label={s.label} color={s.color} bg={s.bg} small={small}/>;}
function StatusDot({status}){
  const color=status==="Resolved"?T.green:status==="Mitigating"?T.amber:T.red;
  return <span style={{display:"inline-flex",alignItems:"center",gap:5}}><span style={{width:7,height:7,borderRadius:"50%",background:color,boxShadow:`0 0 6px ${color}`}}/><span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color}}>{status}</span></span>;
}
function Card({children,style={}}){return <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:16,...style}}>{children}</div>;}
function SectionLabel({children}){return <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:T.muted,letterSpacing:2,marginBottom:10,textTransform:"uppercase"}}>{children}</div>;}

// ═══════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════
function Dashboard({onSelect}){
  const open=INCIDENTS.filter(i=>i.status!=="Resolved");
  const resolved=INCIDENTS.filter(i=>i.status==="Resolved");
  const avgMTTR=Math.round(resolved.filter(i=>i.mttr).reduce((s,i)=>s+parseInt(i.mttr),0)/resolved.filter(i=>i.mttr).length);
  const recent=INCIDENTS.slice(0,20);
  return(
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:20}}>
        {[
          {label:"Total Incidents",val:INCIDENTS.length,color:T.text},
          {label:"Open / Active",val:open.length,color:T.red},
          {label:"Resolved (6mo)",val:resolved.length,color:T.green},
          {label:"Avg MTTR",val:`${avgMTTR}m`,color:T.accent},
          {label:"Sev0 + Sev1",val:INCIDENTS.filter(i=>i.severity==="Sev0"||i.severity==="Sev1").length,color:T.amber},
        ].map(s=><Card key={s.label}><div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:T.muted,letterSpacing:2,marginBottom:6}}>{s.label}</div><div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:28,color:s.color,lineHeight:1}}>{s.val}</div></Card>)}
      </div>
      <Card style={{marginBottom:16}}>
        <SectionLabel>Recent Incidents (showing 20 of {INCIDENTS.length})</SectionLabel>
        <div style={{display:"grid",gridTemplateColumns:"100px 1fr 80px 100px 80px 80px",gap:0}}>
          {["INC ID","TITLE","SEV","STATUS","TEAM","AGO"].map(h=><div key={h} style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:T.muted,padding:"6px 8px",borderBottom:`1px solid ${T.border}`,letterSpacing:1}}>{h}</div>)}
          {recent.map(inc=>(
            <div key={inc.id} onClick={()=>onSelect(inc)} style={{display:"contents",cursor:"pointer"}}>
              {[
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:T.accent}}>{inc.id}</span>,
                <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.text,fontWeight:500}}>{inc.title}</span>,
                <SevBadge sev={inc.severity} small/>,
                <StatusDot status={inc.status}/>,
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:T.muted}}>{TEAMS.find(t=>t.id===inc.team)?.name.split(" ")[0]}</span>,
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:T.muted}}>{ago(inc.createdAt)}</span>,
              ].map((cell,ci)=><div key={ci} style={{padding:"9px 8px",borderBottom:`1px solid ${T.dim}`,display:"flex",alignItems:"center"}}>{cell}</div>)}
            </div>
          ))}
        </div>
      </Card>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Card>
          <SectionLabel>Severity Breakdown</SectionLabel>
          {Object.entries(SEV).map(([sev,s])=>{
            const count=INCIDENTS.filter(i=>i.severity===sev).length;
            return <div key={sev} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:s.color,minWidth:40}}>{s.label}</span>
              <div style={{flex:1,height:6,background:T.dim,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${(count/INCIDENTS.length)*100}%`,background:s.color,borderRadius:3}}/></div>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:T.muted,minWidth:30,textAlign:"right"}}>{count}</span>
            </div>;
          })}
        </Card>
        <Card>
          <SectionLabel>Service Health</SectionLabel>
          {SERVICES.map(svc=>{
            const svcInc=INCIDENTS.filter(i=>i.affectedServices.includes(svc.id)&&i.status!=="Resolved");
            const health=svcInc.length===0?"Resolved":svcInc.some(i=>["Sev0","Sev1"].includes(i.severity))?"Active":"Mitigating";
            const total=INCIDENTS.filter(i=>i.affectedServices.includes(svc.id)).length;
            return <div key={svc.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${T.dim}`}}>
              <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.text,fontWeight:500}}>{svc.name}</span>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:T.muted}}>{total} incidents</span>
                <StatusDot status={health}/>
              </div>
            </div>;
          })}
        </Card>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// INCIDENT DETAIL + RCA
// ═══════════════════════════════════════════════════════════════════
function IncidentDetail({inc}){
  const [graphStep,setGraphStep]=useState(0);
  const [activeHops,setActiveHops]=useState([]);
  const timers=useRef([]);
  const team=TEAMS.find(t=>t.id===inc.team);
  const rootComp=COMPONENTS.find(c=>c.id===inc.rootComponent);
  const cr=CHANGE_REQUESTS.find(c=>c.id===inc.triggeredBy);
  const tsg=TSGS.find(t=>t.id===inc.resolvedBy);
  const rcaHops=[
    {label:"Anchor: Incident node",node:inc.id,type:"incident",cypher:`MATCH (i:Incident {id:"${inc.id}"})`},
    {label:"1-hop → Affected Services",node:inc.affectedServices[0],type:"service",cypher:`MATCH (i)-[:AFFECTS]->(s:Service)`},
    {label:"2-hop → Root Component",node:inc.rootComponent,type:"component",cypher:`MATCH (s)-[:HOSTS]->(c:Component {id:"${inc.rootComponent}"})`},
    {label:"3-hop → Triggering Change",node:inc.triggeredBy||"(none)",type:"change",cypher:`MATCH (i)-[:TRIGGERED_BY]->(cr:ChangeRequest)`},
    {label:"4-hop → Similar Incidents",node:inc.similarIncidents?.[0]||"(none)",type:"incident",cypher:`MATCH (i)-[:SIMILAR_TO]->(prev:Incident)`},
    {label:"5-hop → Historical TSG",node:inc.resolvedBy||"(none)",type:"tsg",cypher:`MATCH (prev)-[:RESOLVED_BY]->(tsg:TSG)`},
  ];
  const startRCA=useCallback(()=>{
    timers.current.forEach(clearTimeout); timers.current=[];
    setGraphStep(0); setActiveHops([]);
    rcaHops.forEach((_,i)=>{const t=setTimeout(()=>{setGraphStep(i+1);setActiveHops(p=>[...p,i]);},500+i*700);timers.current.push(t);});
  },[inc]);
  useEffect(()=>()=>timers.current.forEach(clearTimeout),[]);
  const nodeColor=(type)=>({incident:T.accent,service:T.green,component:T.purple,change:T.amber,tsg:T.cyan}[type]||T.muted);
  return(
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
            <div><div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:T.accent,marginBottom:4}}>{inc.id}</div><div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:16,color:T.text}}>{inc.title}</div></div>
            <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}><SevBadge sev={inc.severity}/><StatusDot status={inc.status}/></div>
          </div>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.muted,lineHeight:1.6,padding:"10px 0",borderTop:`1px solid ${T.dim}`,borderBottom:`1px solid ${T.dim}`,marginBottom:12}}>{inc.summary}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {[["Customer Impact",inc.customerImpact],["MTTR",inc.mttr||"In progress"],["Created",fmt(inc.createdAt)],["Resolved",fmt(inc.resolvedAt)],["Team",team?.name],["Region",inc.region]].map(([k,v])=>(
              <div key={k}><div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:T.muted,letterSpacing:1,marginBottom:2}}>{k}</div><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.text}}>{v}</div></div>
            ))}
          </div>
        </Card>
        {cr&&<Card style={{borderLeft:`3px solid ${T.amber}`}}>
          <SectionLabel>Triggering Change Request</SectionLabel>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:T.amber,marginBottom:4}}>{cr.id}</div>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:T.text,fontWeight:500,marginBottom:6}}>{cr.title}</div>
          <div style={{display:"flex",gap:8}}><Badge label={cr.type} color={T.purple} bg={T.dim} small/><Badge label={`Risk: ${cr.risk}`} color={cr.risk==="High"?T.red:T.amber} bg={T.dim} small/></div>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:T.muted,marginTop:6}}>Deployed: {fmt(cr.deployedAt)} by {cr.author}</div>
        </Card>}
        {tsg&&<Card style={{borderLeft:`3px solid ${T.cyan}`}}>
          <SectionLabel>Applied TSG</SectionLabel>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:T.cyan,marginBottom:4}}>{tsg.id}</div>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:T.text,fontWeight:500,marginBottom:8}}>{tsg.title}</div>
          {tsg.steps.map((s,i)=><div key={i} style={{display:"flex",gap:8,marginBottom:5}}><span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:T.accent,minWidth:16}}>{i+1}.</span><span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:T.muted,lineHeight:1.5}}>{s}</span></div>)}
          <div style={{display:"flex",gap:10,marginTop:8}}><Badge label={`Success: ${tsg.successRate}%`} color={T.green} bg={T.dim} small/><Badge label={`Avg TTR: ${tsg.avgTTR}`} color={T.accent} bg={T.dim} small/></div>
        </Card>}
      </div>
      <div>
        <Card style={{marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div><SectionLabel>GraphRAG Root Cause Analysis</SectionLabel><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.muted}}>Neo4j multi-hop traversal — {inc.id}</div></div>
            <button onClick={startRCA} style={{background:graphStep>0?T.dim:T.accentDim,border:`1px solid ${T.accent}`,color:T.accent,fontFamily:"'DM Mono',monospace",fontSize:10,padding:"6px 14px",cursor:"pointer",borderRadius:4,letterSpacing:1}}>{graphStep>0?"↻ Re-run":"▶ Run RCA"}</button>
          </div>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,marginBottom:14}}>
            {rcaHops.map((h,i)=>{
              const active=activeHops.includes(i); const current=graphStep===i+1;
              return <div key={i} style={{display:"flex",gap:10,padding:"5px 0",borderBottom:`1px solid ${T.dim}`,opacity:active?1:0.2,transition:"opacity 0.4s"}}>
                <span style={{color:active?nodeColor(h.type):T.muted,minWidth:14}}>{active?(current?"▶":"✓"):"·"}</span>
                <div style={{flex:1}}><div style={{color:T.text}}>{h.label}</div><div style={{color:T.muted,fontSize:9,marginTop:1}}>{h.cypher}</div></div>
                {h.node&&active&&<span style={{color:nodeColor(h.type),fontSize:9,alignSelf:"center"}}>{h.node}</span>}
              </div>;
            })}
          </div>
          {graphStep>=rcaHops.length&&<div style={{background:"#0d2010",border:`1px solid ${T.green}40`,borderRadius:6,padding:"10px 12px"}}>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:T.green,marginBottom:4}}>✓ RCA COMPLETE</div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.muted,lineHeight:1.6}}>
              Root cause: <span style={{color:T.amber}}>{cr?.id||"unknown CR"}</span> → component <span style={{color:T.purple}}>{rootComp?.name}</span>. TSG <span style={{color:T.cyan}}>{tsg?.id||"none"}</span>{tsg?` (${tsg.successRate}% success)`:""}.
            </div>
          </div>}
        </Card>
        <Card>
          <SectionLabel>Blast Radius — Service Dependency Graph</SectionLabel>
          <svg viewBox="0 0 720 340" style={{width:"100%",background:T.bg,borderRadius:6,border:`1px solid ${T.dim}`}}>
            {SERVICE_DEPS.map(([from,to,rel],i)=>{
              const f=SVC_POSITIONS[from],t2=SVC_POSITIONS[to]; if(!f||!t2) return null;
              const affected=inc.affectedServices.includes(from)||inc.affectedServices.includes(to);
              return <line key={i} x1={f.x} y1={f.y} x2={t2.x} y2={t2.y} stroke={affected?T.red+"80":T.border} strokeWidth={affected?2:1} strokeDasharray={rel==="READS_FROM"?"4 3":"none"}/>;
            })}
            {SERVICES.map(svc=>{
              const pos=SVC_POSITIONS[svc.id]; if(!pos) return null;
              const isAffected=inc.affectedServices.includes(svc.id);
              const color=isAffected?T.amber:T.green;
              const shortName=svc.name.replace("Azure ","").replace("Microsoft ","");
              return <g key={svc.id}>
                {isAffected&&<circle cx={pos.x} cy={pos.y} r={18} fill={color+"20"} stroke={color+"40"} strokeWidth={1}/>}
                <circle cx={pos.x} cy={pos.y} r={11} fill={T.card} stroke={color} strokeWidth={isAffected?2:1}/>
                <text x={pos.x} y={pos.y+22} textAnchor="middle" style={{fontFamily:"'DM Mono',monospace",fontSize:7,fill:color}}>{shortName.length>12?shortName.slice(0,11)+"…":shortName}</text>
                {isAffected&&<text x={pos.x} y={pos.y+4} textAnchor="middle" style={{fontFamily:"'DM Mono',monospace",fontSize:8,fill:color,fontWeight:700}}>!</text>}
              </g>;
            })}
          </svg>
        </Card>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// GRAPH VISUALIZER — D3 Force Layout
// ═══════════════════════════════════════════════════════════════════
const NODE_TYPE_CONFIG = {
  incident: {color: (n) => SEV[n.severity]?.color || T.muted, radius: 6, label: "Incident"},
  service:  {color: () => T.green,  radius: 20, label: "Service"},
  team:     {color: () => T.accent, radius: 14, label: "Team"},
  change:   {color: () => T.amber,  radius: 8,  label: "Change Request"},
  tsg:      {color: () => T.cyan,   radius: 10, label: "TSG"},
  component:{color: () => T.purple, radius: 9,  label: "Component"},
};

const EDGE_COLOR = {
  AFFECTS:"#f8717180", TRIGGERED_BY:"#fbbf2480", RESOLVED_BY:"#67e8f980",
  SIMILAR_TO:"#64748b50", ASSIGNED_TO:"#4f8ef750", DEPENDS_ON:"#34d39950",
  HOSTS:"#a78bfa80", READS_FROM:"#a78bfa50",
};

function GraphVisualizer() {
  const canvasRef = useRef(null);
  const simRef = useRef(null);
  const animRef = useRef(null);
  const nodesRef = useRef([]);
  const linksRef = useRef([]);
  const transformRef = useRef({k:1, x:0, y:0});
  const hoveredRef = useRef(null);
  const selectedRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragNodeRef = useRef(null);
  const lastMouseRef = useRef({x:0,y:0});

  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState({incident:true, service:true, team:false, change:false, tsg:false, component:false});
  const [sevFilter, setSevFilter] = useState({Sev0:true,Sev1:true,Sev2:true,Sev3:true,Sev4:true});
  const [statusFilter, setStatusFilter] = useState({Resolved:true,Mitigating:true,Active:true});
  const [playing, setPlaying] = useState(false);
  const [timeIdx, setTimeIdx] = useState(100);
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({nodes:0, edges:0});
  const playRef = useRef(false);
  const timeRef = useRef(100);

  // Build graph data
  const {allNodes, allLinks} = useMemo(() => {
    const nd = [];
    const lk = [];

    // Service nodes
    SERVICES.forEach(s => nd.push({id:s.id, label:s.name.replace("Azure ",""), type:"service", data:s, severity:null}));
    // Team nodes
    TEAMS.forEach(t => nd.push({id:t.id, label:t.name, type:"team", data:t, severity:null}));
    // Component nodes
    COMPONENTS.forEach(c => nd.push({id:c.id, label:c.name, type:"component", data:c, severity:null}));
    // CR nodes
    CHANGE_REQUESTS.forEach(c => nd.push({id:c.id, label:c.id, type:"change", data:c, severity:null}));
    // TSG nodes
    TSGS.forEach(t => nd.push({id:t.id, label:t.id, type:"tsg", data:t, severity:null}));
    // Incident nodes
    INCIDENTS.forEach(i => nd.push({id:i.id, label:i.id, type:"incident", data:i, severity:i.severity, createdAt:i.createdAt}));

    const nodeIds = new Set(nd.map(n=>n.id));
    const addLink = (src, tgt, rel) => { if(nodeIds.has(src)&&nodeIds.has(tgt)) lk.push({source:src, target:tgt, rel}); };

    // Build links
    SERVICE_DEPS.forEach(([f,t,r]) => addLink(f,t,r));
    SERVICES.forEach(s => addLink(s.id, s.team, "ASSIGNED_TO"));
    COMPONENTS.forEach(c => addLink(c.service, c.id, "HOSTS"));
    INCIDENTS.forEach(i => {
      i.affectedServices.forEach(s => addLink(i.id, s, "AFFECTS"));
      addLink(i.id, i.team, "ASSIGNED_TO");
      if(i.rootComponent) addLink(i.id, i.rootComponent, "ROOT_CAUSE");
      if(i.triggeredBy && nodeIds.has(i.triggeredBy)) addLink(i.id, i.triggeredBy, "TRIGGERED_BY");
      if(i.resolvedBy && nodeIds.has(i.resolvedBy)) addLink(i.id, i.resolvedBy, "RESOLVED_BY");
      (i.similarIncidents||[]).forEach(s => { if(nodeIds.has(s)) addLink(i.id, s, "SIMILAR_TO"); });
    });

    return {allNodes: nd, allLinks: lk};
  }, []);

  // Filter nodes based on current filters + time
  const filteredData = useMemo(() => {
    const incidentCutoff = INCIDENTS.length > 0 ? new Date(INCIDENTS[Math.floor((1-timeIdx/100)*INCIDENTS.length)]?.createdAt||0) : new Date(0);
    const visibleNodes = allNodes.filter(n => {
      if(n.type === "incident") {
        const inc = n.data;
        if(!filters.incident) return false;
        if(!sevFilter[inc.severity]) return false;
        if(!statusFilter[inc.status]) return false;
        if(new Date(inc.createdAt) < incidentCutoff) return false;
        if(search && !n.id.toLowerCase().includes(search.toLowerCase()) && !n.data.title?.toLowerCase().includes(search.toLowerCase())) return false;
      } else {
        if(!filters[n.type]) return false;
      }
      return true;
    });
    const visibleIds = new Set(visibleNodes.map(n=>n.id));
    const visibleLinks = allLinks.filter(l => visibleIds.has(l.source.id||l.source) && visibleIds.has(l.target.id||l.target));
    return {nodes: visibleNodes, links: visibleLinks};
  }, [filters, sevFilter, statusFilter, timeIdx, search, allNodes, allLinks]);

  // Canvas draw
  const draw = useCallback(() => {
    const canvas = canvasRef.current; if(!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const {k, x: tx, y: ty} = transformRef.current;
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(tx, ty);
    ctx.scale(k, k);

    // Draw edges
    const links = linksRef.current;
    const searchLow = search.toLowerCase();
    links.forEach(l => {
      const src = l.source, tgt = l.target;
      if(!src.x || !tgt.x) return;
      const isHighlighted = selectedRef.current && (src.id===selectedRef.current.id||tgt.id===selectedRef.current.id);
      const isHovered = hoveredRef.current && (src.id===hoveredRef.current.id||tgt.id===hoveredRef.current.id);
      if(selectedRef.current && !isHighlighted) return;
      const baseColor = EDGE_COLOR[l.rel] || "#ffffff20";
      ctx.beginPath();
      ctx.moveTo(src.x, src.y);
      ctx.lineTo(tgt.x, tgt.y);
      ctx.strokeStyle = isHighlighted||isHovered ? baseColor.slice(0,-2)+"ff" : baseColor;
      ctx.lineWidth = isHighlighted ? 2/k : 1/k;
      ctx.stroke();
      // Arrow
      if(isHighlighted || isHovered) {
        const angle = Math.atan2(tgt.y-src.y, tgt.x-src.x);
        const tgtR = NODE_TYPE_CONFIG[tgt.type]?.radius||6;
        const ax = tgt.x - Math.cos(angle)*tgtR, ay = tgt.y - Math.sin(angle)*tgtR;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax-8/k*Math.cos(angle-0.4), ay-8/k*Math.sin(angle-0.4));
        ctx.lineTo(ax-8/k*Math.cos(angle+0.4), ay-8/k*Math.sin(angle+0.4));
        ctx.closePath();
        ctx.fillStyle = baseColor.slice(0,-2)+"cc";
        ctx.fill();
      }
    });

    // Draw nodes
    const nodes = nodesRef.current;
    nodes.forEach(n => {
      if(!n.x) return;
      const cfg = NODE_TYPE_CONFIG[n.type];
      const color = typeof cfg.color==="function" ? cfg.color(n) : cfg.color;
      const r = cfg.radius;
      const isSelected = selectedRef.current?.id === n.id;
      const isHovered = hoveredRef.current?.id === n.id;
      const isSearchMatch = searchLow && (n.id.toLowerCase().includes(searchLow) || n.data?.title?.toLowerCase().includes(searchLow));
      const dimmed = (selectedRef.current && !isSelected &&
        !linksRef.current.some(l=>(l.source.id||l.source)===n.id||(l.target.id||l.target)===n.id||
          (l.source.id||l.source)===selectedRef.current?.id&&(l.target.id||l.target)===n.id||
          (l.target.id||l.target)===selectedRef.current?.id&&(l.source.id||l.source)===n.id)
      ) && !isSearchMatch;

      ctx.globalAlpha = dimmed ? 0.12 : isSelected||isHovered ? 1 : 0.85;
      // Glow for selected/hovered
      if(isSelected || isHovered || isSearchMatch) {
        ctx.beginPath(); ctx.arc(n.x, n.y, r+5/k, 0, Math.PI*2);
        ctx.fillStyle = color+"30"; ctx.fill();
      }
      ctx.beginPath(); ctx.arc(n.x, n.y, r/k, 0, Math.PI*2);
      ctx.fillStyle = isSelected ? color : T.card;
      ctx.strokeStyle = color;
      ctx.lineWidth = (isSelected||isHovered ? 2.5 : 1.5)/k;
      ctx.fill(); ctx.stroke();
      ctx.globalAlpha = 1;

      // Label for service/team or zoomed in
      if(n.type==="service"||(k>1.5&&n.type!=="incident")||isSelected||isHovered||isSearchMatch) {
        ctx.font = `${(isSelected?11:9)/k}px DM Mono, monospace`;
        ctx.fillStyle = color;
        ctx.textAlign = "center";
        ctx.fillText(n.label.slice(0,18), n.x, n.y + r/k + 12/k);
      }
    });
    ctx.restore();
  }, [search]);

  // Init simulation
  useEffect(() => {
    const canvas = canvasRef.current; if(!canvas) return;
    const W = canvas.width, H = canvas.height;
    const {nodes, links} = filteredData;

    // Clone nodes to avoid mutation issues, preserve existing positions
    const existingPos = {};
    (nodesRef.current||[]).forEach(n => { existingPos[n.id]={x:n.x,y:n.y,vx:n.vx,vy:n.vy}; });
    const nodesCopy = nodes.map(n => ({
      ...n,
      x: existingPos[n.id]?.x ?? W/2+(Math.random()-0.5)*300,
      y: existingPos[n.id]?.y ?? H/2+(Math.random()-0.5)*300,
      vx: existingPos[n.id]?.vx ?? 0,
      vy: existingPos[n.id]?.vy ?? 0,
    }));
    const nodeMap = Object.fromEntries(nodesCopy.map(n=>[n.id,n]));
    const linksCopy = links.map(l=>({...l, source:nodeMap[l.source.id||l.source]||l.source, target:nodeMap[l.target.id||l.target]||l.target})).filter(l=>l.source?.x!==undefined&&l.target?.x!==undefined);

    nodesRef.current = nodesCopy;
    linksRef.current = linksCopy;
    setStats({nodes:nodesCopy.length, edges:linksCopy.length});

    if(simRef.current) simRef.current.stop();
    simRef.current = d3.forceSimulation(nodesCopy)
      .force("link", d3.forceLink(linksCopy).id(d=>d.id).distance(d=>{
        const t1=d.source.type, t2=d.target.type;
        if(t1==="service"||t2==="service") return 80;
        if(t1==="team"||t2==="team") return 60;
        return 40;
      }).strength(0.3))
      .force("charge", d3.forceManyBody().strength(d=>d.type==="incident"?-30:-150))
      .force("center", d3.forceCenter(W/2, H/2).strength(0.05))
      .force("collision", d3.forceCollide(d=>NODE_TYPE_CONFIG[d.type]?.radius+4||10))
      .alpha(0.5).alphaDecay(0.02)
      .on("tick", draw);

    return () => { if(simRef.current) simRef.current.stop(); };
  }, [filteredData]);

  // Animation loop for playing timeline
  useEffect(() => {
    if(!playing) return;
    let frame;
    const tick = () => {
      timeRef.current = Math.min(timeRef.current+0.3, 100);
      setTimeIdx(Math.floor(timeRef.current));
      if(timeRef.current >= 100) { setPlaying(false); return; }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  // Canvas resize + interaction
  useEffect(() => {
    const canvas = canvasRef.current; if(!canvas) return;
    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width; canvas.height = rect.height;
      draw();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [draw]);

  // Hit detection
  const getNodeAt = useCallback((mx, my) => {
    const {k, x:tx, y:ty} = transformRef.current;
    const wx = (mx-tx)/k, wy = (my-ty)/k;
    let closest = null, closestDist = Infinity;
    for(const n of nodesRef.current) {
      if(!n.x) continue;
      const r = NODE_TYPE_CONFIG[n.type]?.radius||6;
      const dist = Math.hypot(n.x-wx, n.y-wy);
      if(dist < (r+6)/k && dist < closestDist) { closest=n; closestDist=dist; }
    }
    return closest;
  }, []);

  // Mouse handlers
  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current; if(!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx=e.clientX-rect.left, my=e.clientY-rect.top;
    if(isDraggingRef.current && dragNodeRef.current) {
      const {k,x:tx,y:ty}=transformRef.current;
      dragNodeRef.current.x = (mx-tx)/k;
      dragNodeRef.current.y = (my-ty)/k;
      dragNodeRef.current.fx = dragNodeRef.current.x;
      dragNodeRef.current.fy = dragNodeRef.current.y;
      if(simRef.current) simRef.current.alphaTarget(0.1).restart();
      draw(); return;
    }
    if(isDraggingRef.current) {
      const dx=mx-lastMouseRef.current.x, dy=my-lastMouseRef.current.y;
      transformRef.current.x+=dx; transformRef.current.y+=dy;
      lastMouseRef.current={x:mx,y:my};
      draw(); return;
    }
    const hit = getNodeAt(mx,my);
    hoveredRef.current = hit;
    canvas.style.cursor = hit ? "pointer" : "grab";
    draw();
  },[draw,getNodeAt]);

  const handleMouseDown = useCallback((e) => {
    const canvas = canvasRef.current; if(!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx=e.clientX-rect.left, my=e.clientY-rect.top;
    const hit = getNodeAt(mx, my);
    isDraggingRef.current = true;
    if(hit) { dragNodeRef.current=hit; if(simRef.current) simRef.current.alphaTarget(0.1).restart(); }
    else { dragNodeRef.current=null; lastMouseRef.current={x:mx,y:my}; }
  },[getNodeAt]);

  const handleMouseUp = useCallback((e) => {
    const canvas = canvasRef.current; if(!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx=e.clientX-rect.left, my=e.clientY-rect.top;
    if(dragNodeRef.current) {
      dragNodeRef.current.fx=null; dragNodeRef.current.fy=null;
      if(simRef.current) simRef.current.alphaTarget(0);
    }
    isDraggingRef.current=false; dragNodeRef.current=null;
    const hit=getNodeAt(mx,my);
    if(hit){selectedRef.current=hit; setSelected(hit);}
    else{selectedRef.current=null; setSelected(null);}
    draw();
  },[draw,getNodeAt]);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const canvas=canvasRef.current; if(!canvas) return;
    const rect=canvas.getBoundingClientRect();
    const mx=e.clientX-rect.left, my=e.clientY-rect.top;
    const factor = e.deltaY<0?1.15:0.87;
    const {k,x:tx,y:ty}=transformRef.current;
    const newK=Math.max(0.2,Math.min(5,k*factor));
    transformRef.current={k:newK, x:mx-(mx-tx)*(newK/k), y:my-(my-ty)*(newK/k)};
    draw();
  },[draw]);

  useEffect(()=>{
    const canvas=canvasRef.current; if(!canvas) return;
    canvas.addEventListener("mousemove",handleMouseMove);
    canvas.addEventListener("mousedown",handleMouseDown);
    canvas.addEventListener("mouseup",handleMouseUp);
    canvas.addEventListener("wheel",handleWheel,{passive:false});
    return()=>{
      canvas.removeEventListener("mousemove",handleMouseMove);
      canvas.removeEventListener("mousedown",handleMouseDown);
      canvas.removeEventListener("mouseup",handleMouseUp);
      canvas.removeEventListener("wheel",handleWheel);
    };
  },[handleMouseMove,handleMouseDown,handleMouseUp,handleWheel]);

  const resetView = () => { transformRef.current={k:1,x:0,y:0}; draw(); };
  const reheat = () => { if(simRef.current) simRef.current.alpha(0.5).restart(); };

  // Selected node detail
  const selData = selected?.data;
  const selType = selected?.type;
  const connectedLinks = selected ? linksRef.current.filter(l=>l.source.id===selected.id||l.target.id===selected.id) : [];

  return (
    <div style={{display:"grid",gridTemplateColumns:"260px 1fr 280px",gap:12,height:"80vh"}}>
      {/* Left: filters */}
      <div style={{display:"flex",flexDirection:"column",gap:10,overflowY:"auto"}}>
        <Card style={{padding:14}}>
          <SectionLabel>Node Types</SectionLabel>
          {Object.entries(NODE_TYPE_CONFIG).map(([type,cfg])=>{
            const count=allNodes.filter(n=>n.type===type).length;
            const color=typeof cfg.color==="function"?cfg.color({severity:"Sev2"}):cfg.color;
            return <label key={type} style={{display:"flex",alignItems:"center",gap:8,marginBottom:7,cursor:"pointer"}}>
              <input type="checkbox" checked={!!filters[type]} onChange={e=>setFilters(p=>({...p,[type]:e.target.checked}))} style={{accentColor:color}}/>
              <div style={{width:10,height:10,borderRadius:"50%",border:`1.5px solid ${color}`,background:filters[type]?color+40:"transparent"}}/>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:filters[type]?T.text:T.muted,flex:1}}>{cfg.label}</span>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:T.muted}}>{count}</span>
            </label>;
          })}
        </Card>
        <Card style={{padding:14}}>
          <SectionLabel>Severity (Incidents)</SectionLabel>
          {Object.entries(SEV).map(([sev,s])=>(
            <label key={sev} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,cursor:"pointer"}}>
              <input type="checkbox" checked={!!sevFilter[sev]} onChange={e=>setSevFilter(p=>({...p,[sev]:e.target.checked}))} style={{accentColor:s.color}}/>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:s.color}}>{s.label}</span>
            </label>
          ))}
        </Card>
        <Card style={{padding:14}}>
          <SectionLabel>Status</SectionLabel>
          {["Resolved","Mitigating","Active"].map(st=>{
            const color=st==="Resolved"?T.green:st==="Mitigating"?T.amber:T.red;
            return <label key={st} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,cursor:"pointer"}}>
              <input type="checkbox" checked={!!statusFilter[st]} onChange={e=>setStatusFilter(p=>({...p,[st]:e.target.checked}))} style={{accentColor:color}}/>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color}}>{st}</span>
            </label>;
          })}
        </Card>
        <Card style={{padding:14}}>
          <SectionLabel>Edge Types</SectionLabel>
          {Object.entries(EDGE_COLOR).map(([rel,col])=>(
            <div key={rel} style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
              <div style={{width:20,height:2,background:col.slice(0,-2)+"aa"}}/>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:T.muted}}>{rel}</span>
            </div>
          ))}
        </Card>
      </div>

      {/* Center: canvas */}
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {/* Toolbar */}
        <Card style={{padding:"8px 12px",display:"flex",alignItems:"center",gap:10}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search nodes..." style={{background:T.bg,border:`1px solid ${T.border}`,color:T.text,fontFamily:"'DM Mono',monospace",fontSize:11,padding:"5px 10px",borderRadius:4,outline:"none",width:180}}/>
          <div style={{display:"flex",gap:4}}>
            <button onClick={()=>{setPlaying(p=>{playRef.current=!p;return !p;});if(!playing){timeRef.current=timeIdx;}}} style={{background:playing?T.accentDim:T.dim,border:`1px solid ${playing?T.accent:T.border}`,color:playing?T.accent:T.muted,fontFamily:"'DM Mono',monospace",fontSize:10,padding:"4px 10px",cursor:"pointer",borderRadius:4}}>{playing?"⏸ Pause":"▶ Play Timeline"}</button>
            <button onClick={reheat} style={{background:T.dim,border:`1px solid ${T.border}`,color:T.muted,fontFamily:"'DM Mono',monospace",fontSize:10,padding:"4px 10px",cursor:"pointer",borderRadius:4}}>⚡ Reheat</button>
            <button onClick={resetView} style={{background:T.dim,border:`1px solid ${T.border}`,color:T.muted,fontFamily:"'DM Mono',monospace",fontSize:10,padding:"4px 10px",cursor:"pointer",borderRadius:4}}>⊙ Reset View</button>
          </div>
          <div style={{marginLeft:"auto",fontFamily:"'DM Mono',monospace",fontSize:9,color:T.muted}}>{stats.nodes} nodes · {stats.edges} edges</div>
        </Card>
        {/* Timeline */}
        <Card style={{padding:"8px 12px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:T.muted,whiteSpace:"nowrap"}}>TIMELINE</span>
            <input type="range" min={0} max={100} value={timeIdx} onChange={e=>{const v=+e.target.value;setTimeIdx(v);timeRef.current=v;}} style={{flex:1,accentColor:T.accent,height:4}}/>
            <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:T.accent,minWidth:60,textAlign:"right"}}>
              {timeIdx===100?"All time":`Last ${Math.round((1-timeIdx/100)*180)}d`}
            </span>
          </div>
        </Card>
        {/* Canvas */}
        <div style={{flex:1,background:T.bg,border:`1px solid ${T.border}`,borderRadius:8,overflow:"hidden",position:"relative",minHeight:400}}>
          <canvas ref={canvasRef} style={{width:"100%",height:"100%",display:"block"}}/>
          {stats.nodes===0&&<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:T.muted}}>No nodes match current filters</div>
          </div>}
          <div style={{position:"absolute",bottom:10,right:10,fontFamily:"'DM Mono',monospace",fontSize:9,color:T.muted+"80"}}>Drag to pan · Scroll to zoom · Click node to inspect · Drag node to reposition</div>
        </div>
      </div>

      {/* Right: node detail */}
      <div style={{overflowY:"auto",display:"flex",flexDirection:"column",gap:10}}>
        {selected ? (
          <>
            <Card style={{padding:14}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <Badge label={selType.toUpperCase()} color={typeof NODE_TYPE_CONFIG[selType]?.color==="function"?NODE_TYPE_CONFIG[selType].color(selected):NODE_TYPE_CONFIG[selType]?.color} bg={T.dim}/>
                <button onClick={()=>{selectedRef.current=null;setSelected(null);draw();}} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:16}}>×</button>
              </div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:T.accent,marginBottom:4}}>{selected.id}</div>
              {selType==="incident"&&<>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:12,color:T.text,marginBottom:8}}>{selData.title}</div>
                <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}><SevBadge sev={selData.severity} small/><StatusDot status={selData.status}/></div>
                {[["MTTR",selData.mttr||"Open"],["Region",selData.region],["Error",selData.errorCode],["Impact",selData.customerImpact]].map(([k,v])=>(
                  <div key={k} style={{marginBottom:6}}><div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:T.muted,letterSpacing:2}}>{k}</div><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.text,lineHeight:1.4}}>{v}</div></div>
                ))}
              </>}
              {selType==="service"&&<>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>{selData.name}</div>
                {[["Tier",`Tier ${selData.tier}`],["SLA",selData.sla],["Region",selData.region]].map(([k,v])=>(
                  <div key={k} style={{marginBottom:6}}><div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:T.muted,letterSpacing:2}}>{k}</div><div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:T.green}}>{v}</div></div>
                ))}
              </>}
              {selType==="change"&&<>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:12,color:T.text,marginBottom:8}}>{selData.title}</div>
                {[["Type",selData.type],["Risk",selData.risk],["Author",selData.author],["Deployed",fmt(selData.deployedAt)]].map(([k,v])=>(
                  <div key={k} style={{marginBottom:6}}><div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:T.muted,letterSpacing:2}}>{k}</div><div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:T.amber}}>{v}</div></div>
                ))}
              </>}
              {selType==="tsg"&&<>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:12,color:T.text,marginBottom:8}}>{selData.title}</div>
                {[["Success Rate",selData.successRate+"%"],["Avg TTR",selData.avgTTR]].map(([k,v])=>(
                  <div key={k} style={{marginBottom:6}}><div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:T.muted,letterSpacing:2}}>{k}</div><div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:T.cyan}}>{v}</div></div>
                ))}
              </>}
              {selType==="team"&&<>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>{selData.name}</div>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:T.accent,marginBottom:4}}>{selData.oncall}</div>
              </>}
              {selType==="component"&&<>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:12,color:T.text,marginBottom:8}}>{selData.name}</div>
                {[["Type",selData.type],["Version",selData.version],["Service",selData.service]].map(([k,v])=>(
                  <div key={k} style={{marginBottom:6}}><div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:T.muted,letterSpacing:2}}>{k}</div><div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:T.purple}}>{v}</div></div>
                ))}
              </>}
            </Card>

            <Card style={{padding:14}}>
              <SectionLabel>Connections ({connectedLinks.length})</SectionLabel>
              <div style={{maxHeight:300,overflowY:"auto"}}>
                {connectedLinks.slice(0,20).map((l,i)=>{
                  const other=l.source.id===selected.id?l.target:l.source;
                  const dir=l.source.id===selected.id?"→":"←";
                  const color=EDGE_COLOR[l.rel]?.slice(0,-2)+"ff"||T.muted;
                  return <div key={i} style={{display:"flex",gap:6,alignItems:"flex-start",padding:"5px 0",borderBottom:`1px solid ${T.dim}`}}>
                    <span style={{color,fontSize:11,marginTop:1}}>{dir}</span>
                    <div><div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color,letterSpacing:1}}>{l.rel}</div><div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:T.muted}}>{other.id}</div></div>
                  </div>;
                })}
                {connectedLinks.length>20&&<div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:T.muted,paddingTop:6}}>+{connectedLinks.length-20} more connections</div>}
              </div>
            </Card>
          </>
        ) : (
          <Card style={{padding:14}}>
            <SectionLabel>Graph Statistics</SectionLabel>
            {[
              ["Total Incidents",INCIDENTS.length],
              ["Sev 0+1",INCIDENTS.filter(i=>["Sev0","Sev1"].includes(i.severity)).length],
              ["With Root CR",INCIDENTS.filter(i=>i.triggeredBy).length],
              ["TSG Resolved",INCIDENTS.filter(i=>i.resolvedBy).length],
              ["Services",SERVICES.length],
              ["Teams",TEAMS.length],
              ["Components",COMPONENTS.length],
              ["Change Reqs",CHANGE_REQUESTS.length],
              ["TSGs",TSGS.length],
              ["Visible Nodes",stats.nodes],
              ["Visible Edges",stats.edges],
            ].map(([k,v])=><div key={k} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:`1px solid ${T.dim}`}}>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:T.muted}}>{k}</span>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:T.accent}}>{v}</span>
            </div>)}
            <div style={{marginTop:12,fontFamily:"'DM Mono',monospace",fontSize:9,color:T.dim,lineHeight:1.7}}>
              ← Click any node to inspect<br/>Drag to reposition · Scroll to zoom<br/>Use filters to focus the graph
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TSG RECOMMENDER
// ═══════════════════════════════════════════════════════════════════
function TSGRecommender(){
  const [selected,setSelected]=useState(null);
  const [trace,setTrace]=useState([]);
  const [tracing,setTracing]=useState(false);
  const timers=useRef([]);
  const runTrace=useCallback((tsg)=>{
    timers.current.forEach(clearTimeout);timers.current=[];
    setSelected(tsg);setTracing(true);setTrace([]);
    const steps=[
      `Anchor: Incident with service matching "${tsg.service}"`,
      `1-hop: MATCH (i:Incident)-[:AFFECTS]->(s:Service {id:"${tsg.service}"})`,
      `2-hop: MATCH (i)-[:RESOLVED_BY]->(t:TSG) WHERE t.successRate > 80`,
      `3-hop: MATCH (i)-[:SIMILAR_TO*1..2]->(prev) WHERE prev.status="Resolved"`,
      `Rank by successRate × recency × symptom match`,
      `→ Recommended: ${tsg.id} (${tsg.successRate}% success, avg TTR: ${tsg.avgTTR})`,
    ];
    steps.forEach((s,i)=>{const t=setTimeout(()=>{setTrace(p=>[...p,s]);if(i===steps.length-1)setTracing(false);},400+i*500);timers.current.push(t);});
  },[]);
  useEffect(()=>()=>timers.current.forEach(clearTimeout),[]);
  return(
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
      <Card>
        <SectionLabel>TSG Knowledge Graph — {TSGS.length} Guides Indexed</SectionLabel>
        {TSGS.map(tsg=>{
          const svc=SERVICES.find(s=>s.id===tsg.service);
          const uses=INCIDENTS.filter(i=>i.resolvedBy===tsg.id).length;
          return <div key={tsg.id} onClick={()=>runTrace(tsg)} style={{padding:"12px 0",borderBottom:`1px solid ${T.dim}`,cursor:"pointer",background:selected?.id===tsg.id?T.accentDim+"40":"transparent",transition:"background 0.2s",padding:"10px 8px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
              <div><span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:T.accent}}>{tsg.id}</span><span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:T.muted,marginLeft:8}}>{svc?.name}</span></div>
              <div style={{display:"flex",gap:6}}><Badge label={`${tsg.successRate}%`} color={tsg.successRate>90?T.green:T.amber} bg={T.dim} small/><Badge label={tsg.avgTTR} color={T.purple} bg={T.dim} small/></div>
            </div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.text,fontWeight:500,marginBottom:4}}>{tsg.title}</div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:T.muted}}>Applied in {uses} incidents</div>
          </div>;
        })}
      </Card>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {selected?<>
          <Card style={{borderLeft:`3px solid ${T.cyan}`}}>
            <SectionLabel>GraphRAG Recommendation Trace</SectionLabel>
            {trace.map((s,i)=><div key={i} style={{display:"flex",gap:8,padding:"5px 0",borderBottom:`1px solid ${T.dim}`,animation:"fade-up 0.3s ease"}}>
              <span style={{color:i===trace.length-1?T.cyan:T.green,fontFamily:"'DM Mono',monospace",fontSize:10}}>{i===trace.length-1&&!tracing?"★":"✓"}</span>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:i===trace.length-1?T.text:T.muted,lineHeight:1.5}}>{s}</span>
            </div>)}
            {tracing&&<div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:T.accent,padding:"5px 0"}}>▶ traversing...</div>}
          </Card>
          <Card>
            <SectionLabel>Resolution Steps</SectionLabel>
            {selected.steps.map((s,i)=><div key={i} style={{display:"flex",gap:10,padding:"8px 0",borderBottom:`1px solid ${T.dim}`}}>
              <div style={{minWidth:22,height:22,borderRadius:"50%",border:`1px solid ${T.accent}`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Mono',monospace",fontSize:9,color:T.accent}}>{i+1}</div>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:T.muted,lineHeight:1.6,alignSelf:"center"}}>{s}</span>
            </div>)}
          </Card>
        </>:<Card><div style={{textAlign:"center",padding:40}}>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:T.muted}}>← Select a TSG to see the GraphRAG recommendation trace</div>
        </div></Card>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// QUERY SHOWDOWN (simplified — 3 showcase queries)
// ═══════════════════════════════════════════════════════════════════
const SHOWDOWN_QUERIES = [
  {id:"sq1",title:"Full Blast Radius — Upstream Change Attribution",
   question:"Which engineer's change request, deployed in the last 72 hours, caused a cascade touching 3+ downstream services with combined MTTR > 2 hours?",
   complexity:"5-hop",speedup:"20×",accuracyGain:"+64pp",
   sql:{latencyMs:8400,resultAccuracy:"61%",rowsScanned:"2,100,000+",
     query:`SELECT cr.author, COUNT(DISTINCT s2.id) AS downstream_count,
  SUM(i.mttr_minutes) AS total_mttr
FROM change_requests cr
JOIN incidents i ON i.triggered_by = cr.id
JOIN incident_services is1 ON is1.incident_id = i.id
JOIN service_dependencies sd ON sd.upstream_id = is1.service_id
JOIN services s2 ON s2.id = sd.downstream_id
WHERE cr.deployed_at > NOW() - INTERVAL '72 hours'
GROUP BY cr.author
HAVING COUNT(DISTINCT s2.id) >= 3
  AND SUM(i.mttr_minutes) > 120
ORDER BY total_mttr DESC;
-- 5-way JOIN: full scan on incidents (2.1M rows)
-- service_deps self-join is O(n²) — no transitive index`,
     problems:["5-way JOIN causes full table scan (2.1M rows)","service_dependencies self-join is O(n²)","No composite index on triggered_by + deployed_at","Query planner falls back to nested loop at scale"]},
   vector:{latencyMs:2100,resultAccuracy:"34%",rowsScanned:"~180,000 vectors",
     query:`query_vec = embed("change request cascade 3 services MTTR 2h")
results = azure_search.search(vector=query_vec, top_k=20)
# Post-filter: no graph awareness
for r in results:
  if r['affected_services_count'] >= 3:
    candidates.append(r)
# Missing: CR→INC→SVC chain, real MTTR aggregation`,
     problems:["Semantic match can't verify 3-service threshold","No way to aggregate MTTR across linked incidents","CR→INC→SVC dependency chain invisible to embeddings","35% false positive rate — irrelevant incident noise"]},
   graph:{latencyMs:420,resultAccuracy:"98%",hops:5,nodesTraversed:847,
     query:`MATCH (cr:ChangeRequest)
WHERE cr.deployedAt > datetime() - duration('P3D')
MATCH (cr)<-[:TRIGGERED_BY]-(i:Incident)
MATCH (i)-[:AFFECTS]->(s:Service)
MATCH (s)<-[:DEPENDS_ON]-(downstream:Service)
WITH cr, collect(DISTINCT i) AS incidents,
     collect(DISTINCT downstream) AS downstreams,
     sum(i.mttrMinutes) AS totalMttr
WHERE size(downstreams) >= 3 AND totalMttr > 120
RETURN cr.author, cr.id, size(incidents), totalMttr
ORDER BY totalMttr DESC`,
     whyFast:["Native graph index on relationship types — no JOINs","Traversal prunes dead branches early (push-down)","Relationship indexes: O(1) hop cost per edge","Working memory assembly — no disk I/O"]}},
  {id:"sq2",title:"Recurring Failure Pattern — Cross-Team RCA Clustering",
   question:"Find all incidents in the last 90 days sharing the same root component AND error code family but assigned to DIFFERENT teams — exposing duplicate investigation work.",
   complexity:"4-hop",speedup:"34×",accuracyGain:"+56pp",
   sql:{latencyMs:12800,resultAccuracy:"52%",rowsScanned:"4,400,000+ (self-join)",
     query:`SELECT i1.id, i2.id, i1.root_component_id,
  i1.team_id, i2.team_id,
  SIMILARITY(i1.error_code, i2.error_code) AS sim
FROM incidents i1
JOIN incidents i2
  ON i1.root_component_id = i2.root_component_id
  AND i1.team_id != i2.team_id
  AND i1.id < i2.id
  AND i1.created_at > NOW() - INTERVAL '90 days'
  AND i2.created_at > NOW() - INTERVAL '90 days'
WHERE SIMILARITY(i1.error_code, i2.error_code) > 0.6
ORDER BY sim DESC;
-- Cartesian self-join: 4.4M row² — no index possible`,
     problems:["Cartesian self-join on incidents: 4.4M row²","SIMILARITY() blocks index usage on every pair","Misses component version drift as matching signal","Can't detect duplicate team routing anti-pattern"]},
   vector:{latencyMs:18600,resultAccuracy:"41%",rowsScanned:"~180,000 embeddings",
     query:`embeddings = [embed(inc.summary) for inc in last_90_days]
clusters = kmeans(embeddings, k=50)
for cluster in clusters:
  teams = set(inc.team for inc in cluster.incidents)
  if len(teams) > 1:
    duplicates.append(cluster)
# KMeans clusters by TEXT similarity
# Component ID and team ownership absent from vector space`,
     problems:["KMeans over 90d corpus: 180K embeddings, 4+ min offline","Clusters by description — component ID not in vector","Team ownership is metadata, not encoded in embedding","k=50 arbitrary — rare 2-incident duplicates lost in noise"]},
   graph:{latencyMs:380,resultAccuracy:"97%",hops:4,nodesTraversed:612,
     query:`MATCH (i1:Incident)-[:ROOT_CAUSE]->(comp:Component)
        <-[:ROOT_CAUSE]-(i2:Incident)
WHERE i1.createdAt > datetime()-duration('P90D')
  AND i1.id < i2.id
MATCH (i1)-[:ASSIGNED_TO]->(t1:Team)
MATCH (i2)-[:ASSIGNED_TO]->(t2:Team)
WHERE t1 <> t2
MATCH (i1)-[:HAS_ERROR]->(e:ErrorFamily)
MATCH (i2)-[:HAS_ERROR]->(e)
RETURN comp.name, i1.id, t1.name,
       i2.id, t2.name, e.family
ORDER BY comp.name`,
     whyFast:["Component→Incident index: direct pointer lookup","Team ownership is a first-class graph edge — O(1)","ErrorFamily taxonomy pre-modeled as node type","No self-join: bilateral traversal from component outward"]}},
  {id:"sq3",title:"TSG Effectiveness Decay — Temporal Knowledge Graph",
   question:"Which TSGs have seen success rate degrade >15% in the last 60 days vs lifetime average, and what component version changes correlate with that degradation?",
   complexity:"5-hop + temporal",speedup:"15×",accuracyGain:"+41pp",
   sql:{latencyMs:7600,resultAccuracy:"55%",rowsScanned:"1,800,000 (3 scans)",
     query:`WITH tsg_lifetime AS (
  SELECT tsg_id,
    AVG(CASE WHEN resolved THEN 1.0 ELSE 0 END) AS lifetime_rate
  FROM tsg_applications GROUP BY tsg_id
),
tsg_recent AS (
  SELECT tsg_id,
    AVG(CASE WHEN resolved THEN 1.0 ELSE 0 END) AS recent_rate
  FROM tsg_applications
  WHERE applied_at > NOW() - INTERVAL '60 days'
  GROUP BY tsg_id
)
SELECT l.tsg_id, l.lifetime_rate - r.recent_rate AS degradation
FROM tsg_lifetime l JOIN tsg_recent r USING (tsg_id)
WHERE l.lifetime_rate - r.recent_rate > 0.15;
-- 3 separate CTEs, each a full table scan`,
     problems:["Three CTEs, each requiring full scan of tsg_applications","Correlation to component version change is manual join","No temporal edge modeling — version history is flat rows","Can't detect indirect component changes in same query"]},
   vector:{latencyMs:9100,resultAccuracy:"18%",rowsScanned:"~200,000 embeddings + 180K incidents",
     query:`# Fundamentally wrong tool for this query
tsg_vecs = {t.id: embed(t.content) for t in tsgs}
for tsg_id, vec in tsg_vecs.items():
  recent = [i for i in resolved_60d
    if cosine(embed(i.summary), vec) > 0.75]
# Cosine similarity ≠ TSG success/failure
# No temporal dimension in embedding space
# Component version history is structured — not text`,
     problems:["Cosine similarity ≠ TSG success rate — wrong metric","No temporal dimension in embedding space","Component version history is structured metadata, not text","Can't model 'degradation over time' without graph edges"]},
   graph:{latencyMs:510,resultAccuracy:"96%",hops:5,nodesTraversed:934,
     query:`MATCH (tsg:TSG)-[:APPLIED_IN]->(app:Application)
WITH tsg,
  avg(CASE WHEN app.createdAt < datetime()-duration('P60D')
    THEN toFloat(app.resolved) END) AS lifetimeRate,
  avg(CASE WHEN app.createdAt >= datetime()-duration('P60D')
    THEN toFloat(app.resolved) END) AS recentRate
WHERE lifetimeRate - recentRate > 0.15
MATCH (tsg)-[:TARGETS]->(comp:Component)
  -[:HAD_CHANGE]->(cr:ChangeRequest)
WHERE cr.deployedAt >= datetime()-duration('P60D')
RETURN tsg.id, round(lifetimeRate*100)+'%',
       round(recentRate*100)+'%', cr.id, comp.version
ORDER BY (lifetimeRate-recentRate) DESC`,
     whyFast:["Time windows as graph filters — no CTE overhead","Version history stored as [:HAD_CHANGE] edges — O(1)","Causal correlation: overlap window built into query","Single pass over TSG nodes — no repeated table scans"]}},
];

function QueryShowdown(){
  const [selected,setSelected]=useState(0);
  const [runPhase,setRunPhase]=useState({});   // idle|running|done per engine
  const [runTimes,setRunTimes]=useState({});   // live ms per engine
  const [activeEngine,setActiveEngine]=useState("graph");
  const intervals=useRef({});
  const timers=useRef([]);
  const q=SHOWDOWN_QUERIES[selected];

  const clearAll=()=>{
    Object.values(intervals.current).forEach(clearInterval);
    intervals.current={};
    timers.current.forEach(clearTimeout);
    timers.current=[];
  };

  // All three engines start together — GraphRAG finishes first, dramatically
  const runAll=useCallback(()=>{
    clearAll();
    setRunPhase({sql:"running",vector:"running",graph:"running"});
    setRunTimes({sql:0,vector:0,graph:0});

    const wallStart=Date.now();

    // Live counters — all tick from the same start
    intervals.current.sql    = setInterval(()=>setRunTimes(p=>({...p,sql:Date.now()-wallStart})),80);
    intervals.current.vector = setInterval(()=>setRunTimes(p=>({...p,vector:Date.now()-wallStart})),60);
    intervals.current.graph  = setInterval(()=>setRunTimes(p=>({...p,graph:Date.now()-wallStart})),20);

    // GraphRAG finishes first — real wall time ~0.9s regardless of scenario
    const graphWall = 900;
    timers.current.push(setTimeout(()=>{
      clearInterval(intervals.current.graph);
      setRunTimes(p=>({...p,graph:q.graph.latencyMs}));
      setRunPhase(p=>({...p,graph:"done"}));
    }, graphWall));

    // Vector finishes second — real wall ~2.8s
    const vectorWall = Math.min(q.vector.latencyMs*0.25, 2800);
    timers.current.push(setTimeout(()=>{
      clearInterval(intervals.current.vector);
      setRunTimes(p=>({...p,vector:q.vector.latencyMs}));
      setRunPhase(p=>({...p,vector:"done"}));
    }, vectorWall));

    // SQL finishes last — real wall ~4.5s
    const sqlWall = Math.min(q.sql.latencyMs*0.4, 4500);
    timers.current.push(setTimeout(()=>{
      clearInterval(intervals.current.sql);
      setRunTimes(p=>({...p,sql:q.sql.latencyMs}));
      setRunPhase(p=>({...p,sql:"done"}));
    }, sqlWall));
  },[q]);

  useEffect(()=>{clearAll();setRunPhase({});setRunTimes({});},[selected]);
  useEffect(()=>()=>clearAll(),[]);

  const allDone=runPhase.sql==="done"&&runPhase.vector==="done"&&runPhase.graph==="done";
  const graphDoneFirst=runPhase.graph==="done"&&(runPhase.sql!=="done"||runPhase.vector!=="done");

  const EngineBar=({engine,label,color,latency,phase})=>{
    const t=runTimes[engine]||0;
    const isDone=phase==="done",isRunning=phase==="running";
    // Progress: for graph use actual wall progress; for others show slower fill
    const pct = isDone ? 100 :
      isRunning && engine==="graph" ? Math.min(95, (t/latency)*100) :
      isRunning ? Math.min(92, (t/latency)*100) : 0;

    return <div style={{background:T.card,border:`2px solid ${isDone?color:isRunning?color+"40":T.border}`,borderRadius:8,padding:"12px 14px",marginBottom:8,transition:"border-color 0.3s",position:"relative",overflow:"hidden"}}>
      {/* Sweep glow when done */}
      {isDone&&<div style={{position:"absolute",inset:0,background:`linear-gradient(90deg,transparent,${color}08,transparent)`,animation:"sweep 0.8s ease"}}/>}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {isRunning&&<span style={{width:7,height:7,borderRadius:"50%",background:color,display:"inline-block",boxShadow:`0 0 8px ${color}`,animation:"pulse-dot 0.8s ease infinite"}}/>}
          {isDone&&<span style={{color,fontSize:13}}>✓</span>}
          {!isRunning&&!isDone&&<span style={{width:7,height:7,borderRadius:"50%",background:T.dim,display:"inline-block"}}/>}
          <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:isDone?color:isRunning?T.text:T.muted,fontWeight:isDone?700:400}}>{label}</span>
          {isDone&&engine==="graph"&&<span style={{fontFamily:"'DM Mono',monospace",fontSize:8,background:T.green+"20",border:`1px solid ${T.green}40`,color:T.green,borderRadius:3,padding:"1px 6px",letterSpacing:0.5}}>WINNER</span>}
        </div>
        <span style={{fontFamily:"'DM Mono',monospace",fontSize:isDone?22:14,color:isDone?color:isRunning?T.text:T.muted,fontWeight:700,letterSpacing:-0.5,transition:"font-size 0.3s,color 0.3s"}}>
          {isRunning||isDone ? `${(isDone?latency:t).toLocaleString()}ms` : "—"}
        </span>
      </div>
      <div style={{height:6,background:T.dim,borderRadius:3,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${pct}%`,background:color,borderRadius:3,transition:isRunning?"width 0.1s linear":"width 0.5s ease",boxShadow:isRunning?`0 0 8px ${color}60`:""}}/>
      </div>
      {isDone&&<div style={{display:"flex",gap:12,marginTop:7,flexWrap:"wrap"}}>
        <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:T.muted}}>{engine==="graph"?`${q.graph.nodesTraversed} nodes traversed`:engine==="sql"?q.sql.rowsScanned:q.vector.rowsScanned}</span>
        <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:engine==="graph"?T.green:T.red,fontWeight:600}}>{engine==="sql"?q.sql.resultAccuracy:engine==="vector"?q.vector.resultAccuracy:q.graph.resultAccuracy} accuracy</span>
      </div>}
    </div>;
  };

  const CodeBlock=({engine})=>{
    const cfg=engine==="sql"?{color:"#f87171",lang:"T-SQL",data:q.sql}:engine==="vector"?{color:"#fbbf24",lang:"Python / VectorDB",data:q.vector}:{color:T.green,lang:"Neo4j Cypher",data:q.graph};
    const kwSql=/\b(SELECT|FROM|JOIN|WHERE|GROUP BY|HAVING|ORDER BY|WITH|AND|ON|AS|COUNT|SUM|AVG|CASE|WHEN|THEN|END|LEFT|INNER|UNION|NOT|DISTINCT)\b/g;
    const kwPy=/\b(for|in|if|return|import|from|class|with|as|def|and|or|not|pass|True|False|None)\b/g;
    const kwCy=/\b(MATCH|WHERE|WITH|RETURN|ORDER BY|LIMIT|AND|OR|NOT|UNWIND|collect|size|avg|sum|count|round|datetime|duration)\b/g;
    const kw=engine==="sql"?kwSql:engine==="vector"?kwPy:kwCy;
    const coloredCode=cfg.data.query.split(/(\n|\/\/[^\n]*|#[^\n]*)/g).map((seg,i)=>{
      if(seg.startsWith("//") || seg.startsWith("#")) return <span key={i} style={{color:"#64748b",fontStyle:"italic"}}>{seg}</span>;
      if(seg==="\n") return <br key={i}/>;
      return <span key={i}>{seg.split(kw).map((tok,j)=>
        new RegExp(`^(${kw.source.slice(3,-3)})$`).test(tok)?<span key={j} style={{color:cfg.color}}>{tok}</span>:<span key={j}>{tok}</span>
      )}</span>;
    });
    const probs=engine==="graph"?q.graph.whyFast:(engine==="sql"?q.sql.problems:q.vector.problems);
    const isGraph=engine==="graph";
    return <div>
      <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:cfg.color,letterSpacing:2,marginBottom:8,display:"flex",justifyContent:"space-between"}}>
        <span>{cfg.lang}</span>
        <span style={{color:T.muted}}>{cfg.data.latencyMs?.toLocaleString()}ms · {cfg.data.resultAccuracy} accurate</span>
      </div>
      <pre style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#94a3b8",lineHeight:1.7,whiteSpace:"pre-wrap",marginBottom:12,maxHeight:200,overflowY:"auto",background:T.bg,padding:"10px 12px",borderRadius:6}}>{coloredCode}</pre>
      <div style={{borderTop:`1px solid ${T.dim}`,paddingTop:10}}>
        <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:T.muted,letterSpacing:1,marginBottom:6}}>{isGraph?"WHY GRAPHRAG WINS":"FAILURE MODES"}</div>
        {probs.map((p,i)=><div key={i} style={{display:"flex",gap:6,marginBottom:4}}>
          <span style={{color:isGraph?T.green:"#f87171",fontSize:10}}>{isGraph?"✓":"✗"}</span>
          <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:T.muted,lineHeight:1.5}}>{p}</span>
        </div>)}
      </div>
    </div>;
  };

  return <div>
    <style>{`@keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    <div style={{marginBottom:20,display:"flex",alignItems:"center",gap:12}}>
      <div style={{width:3,height:32,background:`linear-gradient(180deg,${T.accent},${T.purple})`,borderRadius:2}}/>
      <div>
        <h2 style={{fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:20,color:T.text,letterSpacing:-0.3}}>GraphRAG Query Showdown</h2>
        <p style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:T.muted,marginTop:2}}>SQL vs VectorDB vs Neo4j GraphRAG · all engines start simultaneously · watch who wins</p>
      </div>
    </div>

    {/* Query selector */}
    <div style={{display:"flex",gap:6,marginBottom:16}}>
      {SHOWDOWN_QUERIES.map((q2,i)=><button key={q2.id} onClick={()=>setSelected(i)} style={{flex:1,background:selected===i?T.accentDim:T.dim,border:`1px solid ${selected===i?T.accent:T.border}`,color:selected===i?T.accent:T.muted,fontFamily:"'DM Mono',monospace",fontSize:10,padding:"8px 10px",cursor:"pointer",borderRadius:4,textAlign:"left"}}>
        <div style={{fontSize:8,letterSpacing:2,marginBottom:3}}>Q{i+1} · {q2.complexity}</div>
        <div style={{fontWeight:600}}>{q2.title.split("—")[0].trim()}</div>
      </button>)}
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
      {/* Left: race panel */}
      <div>
        <Card style={{marginBottom:12,padding:"14px 16px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
            <div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:T.accent,letterSpacing:2,marginBottom:4}}>Q{selected+1} · {q.complexity}</div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:14,color:T.text}}>{q.title}</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:4,alignItems:"flex-end"}}>
              <Badge label={`${q.speedup} faster`} color={T.green} bg="#0d2010"/>
              <Badge label={q.accuracyGain+" accuracy"} color={T.accent} bg={T.accentDim}/>
            </div>
          </div>
          <div style={{background:T.bg,borderRadius:6,padding:"8px 12px"}}>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.muted,lineHeight:1.6,fontStyle:"italic"}}>"{q.question}"</div>
          </div>
        </Card>

        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:T.muted,letterSpacing:1}}>EXECUTION RACE</div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:T.muted,marginTop:2}}>All engines start simultaneously ↓</div>
            </div>
            <button onClick={runAll} style={{background:T.accentDim,border:`1px solid ${T.accent}`,color:T.accent,fontFamily:"'DM Mono',monospace",fontSize:10,padding:"7px 18px",cursor:"pointer",borderRadius:4,letterSpacing:1}}>
              {Object.keys(runPhase).length>0?"↻ RE-RUN":"▶ RUN RACE"}
            </button>
          </div>

          <EngineBar engine="sql"    label="Azure SQL / Traditional DB"  color="#f87171" latency={q.sql.latencyMs}    phase={runPhase.sql   ||"idle"}/>
          <EngineBar engine="vector" label="Azure AI Search / VectorDB"  color="#fbbf24" latency={q.vector.latencyMs} phase={runPhase.vector||"idle"}/>
          <EngineBar engine="graph"  label="Neo4j GraphRAG"              color={T.green} latency={q.graph.latencyMs}  phase={runPhase.graph ||"idle"}/>

          {/* GraphRAG wins callout — shown as soon as graph is done, before SQL/Vector finish */}
          {graphDoneFirst&&<div style={{marginTop:10,padding:"10px 14px",background:"#0a1a0f",border:`1px solid ${T.green}60`,borderRadius:6,animation:"fade-up 0.4s ease",display:"flex",alignItems:"center",gap:14}}>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:900,fontSize:28,color:T.green,lineHeight:1}}>{Math.round(q.sql.latencyMs/q.graph.latencyMs)}×</div>
            <div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:T.green,fontWeight:700}}>🏁 GraphRAG finished — SQL still running</div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:T.muted,marginTop:2}}>
                Graph: {q.graph.latencyMs}ms · SQL: {(runTimes.sql||0).toLocaleString()}ms and counting…
              </div>
            </div>
          </div>}

          {allDone&&<div style={{marginTop:10,background:"#0a1a0f",border:`1px solid ${T.green}40`,borderRadius:6,padding:"12px 14px",animation:"fade-up 0.4s ease"}}>
            <div style={{display:"flex",gap:20,flexWrap:"wrap",marginBottom:8}}>
              <div><div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:T.muted,marginBottom:2}}>VS SQL</div><div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:900,fontSize:28,color:T.green,letterSpacing:-1}}>{Math.round(q.sql.latencyMs/q.graph.latencyMs)}<span style={{fontSize:16}}>×</span></div></div>
              <div><div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:T.muted,marginBottom:2}}>VS VECTOR</div><div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:900,fontSize:28,color:T.amber,letterSpacing:-1}}>{Math.round(q.vector.latencyMs/q.graph.latencyMs)}<span style={{fontSize:16}}>×</span></div></div>
              <div><div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:T.muted,marginBottom:2}}>ACCURACY GAIN</div><div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:900,fontSize:28,color:T.accent,letterSpacing:-1}}>{q.accuracyGain}</div></div>
              <div><div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:T.muted,marginBottom:2}}>NODES VISITED</div><div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:900,fontSize:28,color:T.cyan,letterSpacing:-1}}>{q.graph.nodesTraversed.toLocaleString()}</div></div>
            </div>
          </div>}
        </Card>
      </div>

      {/* Right: query code */}
      <Card>
        <div style={{display:"flex",gap:4,marginBottom:14}}>
          {[["sql","T-SQL","#f87171"],["vector","VectorDB","#fbbf24"],["graph","Cypher",T.green]].map(([id,label,color])=>(
            <button key={id} onClick={()=>setActiveEngine(id)} style={{flex:1,background:activeEngine===id?T.card:T.dim,border:`1px solid ${activeEngine===id?color+"60":T.border}`,borderBottom:`2px solid ${activeEngine===id?color:"transparent"}`,color:activeEngine===id?color:T.muted,fontFamily:"'DM Mono',monospace",fontSize:10,padding:"7px 10px",cursor:"pointer",borderRadius:"4px 4px 0 0",letterSpacing:0.5}}>{label}</button>
          ))}
        </div>
        <CodeBlock engine={activeEngine}/>
      </Card>
    </div>
  </div>;
}

// ═══════════════════════════════════════════════════════════════════
// WAR ROOM — LIVE P0 CASCADE REPLAY
// ═══════════════════════════════════════════════════════════════════
const WAR_ROOM_EVENTS = [
  {t:0,   type:"alert",   sev:"Sev1", msg:"🔴 ALERT: AAD STS error rate 23% — auth token issuance failures detected", src:"Azure Monitor",    blast:["svc-aad"]},
  {t:18,  type:"page",    sev:"Sev1", msg:"📟 PagerDuty: identity-icm@ms.com paged — INC-2901 opened", src:"IcM System",       blast:["svc-aad"]},
  {t:34,  type:"cascade", sev:"Sev1", msg:"⚠️  Azure DevOps pipelines failing — SSO dependency on AAD STS", src:"ADO Health",      blast:["svc-aad","svc-ado"]},
  {t:52,  type:"cascade", sev:"Sev2", msg:"⚠️  Key Vault secret retrieval degraded — AAD auth required for HSM access", src:"Key Vault Metrics",blast:["svc-aad","svc-ado","svc-keyvault"]},
  {t:71,  type:"alert",   sev:"Sev2", msg:"📊 App Service: 503 spike — 12% of apps depend on KV secrets for startup", src:"App Insights",   blast:["svc-aad","svc-ado","svc-keyvault","svc-appSvc"]},
  {t:89,  type:"action",  sev:"info", msg:"👤 [WITHOUT GraphRAG] Engineer begins manual SQL joins — querying incident history...", src:"Manual Ops", blast:["svc-aad","svc-ado","svc-keyvault","svc-appSvc"]},
  {t:180, type:"action",  sev:"info", msg:"🔍 SQL query #1 complete (47s) — 2.1M rows scanned. Incident list returned, no causal chain.", src:"Azure SQL", blast:["svc-aad","svc-ado","svc-keyvault","svc-appSvc"]},
  {t:320, type:"action",  sev:"info", msg:"🔍 SQL query #2 (3 JOINs) — linking incidents to change requests... timed out after 90s.", src:"Azure SQL", blast:["svc-aad","svc-ado","svc-keyvault","svc-appSvc"]},
  {t:420, type:"cost",    sev:"cost", msg:"💸 Cumulative SLA credit exposure: $2,940,000 (7 min × $420K/min blended rate)", src:"Finance",     blast:["svc-aad","svc-ado","svc-keyvault","svc-appSvc"]},
  {t:480, type:"graphrag",sev:"graph",msg:"🕸 [GRAPHRAG ONLINE] Neo4j traversal: INC-2901 → TRIGGERED_BY → CR-9904 (cert rotation)", src:"GraphRAG Engine",blast:["svc-aad","svc-ado","svc-keyvault","svc-appSvc"]},
  {t:496, type:"graphrag",sev:"graph",msg:"🕸 GraphRAG: AAD STS cert chain mismatch confirmed — 5-hop traversal in 380ms", src:"GraphRAG Engine",blast:["svc-aad","svc-ado","svc-keyvault","svc-appSvc"]},
  {t:504, type:"graphrag",sev:"graph",msg:"🕸 GraphRAG: TSG-382 recommended — AAD STS Certificate Chain Validation (89% success rate)", src:"GraphRAG Engine",blast:["svc-aad","svc-ado","svc-keyvault","svc-appSvc"]},
  {t:512, type:"resolve", sev:"Sev1", msg:"✅ TSG-382 applied — cert chain corrected, STS cache cleared. Token issuance resuming.", src:"team-aad",  blast:["svc-aad"]},
  {t:540, type:"resolve", sev:"info", msg:"✅ ADO pipelines recovering — SSO auth restored.", src:"team-ado",   blast:["svc-ado"]},
  {t:558, type:"resolve", sev:"info", msg:"✅ Key Vault HSM access restored. App Service workers restarting.", src:"team-sec",   blast:[]},
  {t:570, type:"resolve", sev:"info", msg:"🟢 INC-2901 RESOLVED — MTTR: 87 min (manual) vs 8 min (GraphRAG counterfactual)", src:"IcM System", blast:[]},
];

function WarRoom(){
  const [playing,setPlaying]=useState(false);
  const [elapsed,setElapsed]=useState(0);
  const [visibleEvents,setVisibleEvents]=useState([]);
  const [costTick,setCostTick]=useState(0);
  const intervalRef=useRef(null);
  const feedRef=useRef(null);
  const maxT=WAR_ROOM_EVENTS[WAR_ROOM_EVENTS.length-1].t+30;

  const currentBlast=useMemo(()=>{
    const last=[...WAR_ROOM_EVENTS].filter(e=>e.t<=elapsed).pop();
    return last?.blast||[];
  },[elapsed]);

  const savedMins=useMemo(()=>{
    const graphragOn=elapsed>=480;
    if(!graphragOn) return 0;
    return Math.min(79, Math.floor((elapsed-480)/10)*9);
  },[elapsed]);

  const costSaved=useMemo(()=>savedMins*420000,[savedMins]);

  useEffect(()=>{
    if(!playing) return;
    intervalRef.current=setInterval(()=>{
      setElapsed(p=>{
        const next=p+1;
        if(next>maxT){setPlaying(false);return maxT;}
        return next;
      });
    },40);
    return()=>clearInterval(intervalRef.current);
  },[playing,maxT]);

  useEffect(()=>{
    const ev=WAR_ROOM_EVENTS.filter(e=>e.t<=elapsed&&!visibleEvents.find(v=>v.t===e.t));
    if(ev.length){setVisibleEvents(p=>[...p,...ev]);}
    setCostTick(elapsed*7000);
    if(feedRef.current) feedRef.current.scrollTop=feedRef.current.scrollHeight;
  },[elapsed]);

  const reset=()=>{setElapsed(0);setVisibleEvents([]);setPlaying(false);setCostTick(0);};

  const evColor=(type)=>({alert:T.red,cascade:T.amber,page:T.purple,action:T.muted,graphrag:T.green,resolve:T.green,cost:"#f97316"}[type]||T.muted);
  const sevStroke=(sev)=>({Sev0:"#ef4444",Sev1:"#f97316",Sev2:T.amber,graph:T.green,cost:"#f97316",info:T.muted,resolve:T.green}[sev]||T.muted);

  const graphragActive=elapsed>=480;
  const pctDone=Math.min(100,(elapsed/maxT)*100);
  const minsElapsed=Math.floor(elapsed/10);

  return(
    <div>
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0.2}}@keyframes sweep{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:none}}`}</style>
      {/* Header */}
      <div style={{background:"#1a0808",border:`1px solid ${T.red}40`,borderRadius:10,padding:"16px 20px",marginBottom:16,display:"flex",alignItems:"center",gap:20}}>
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
            {playing&&<div style={{width:9,height:9,borderRadius:"50%",background:T.red,animation:"blink 1s ease infinite"}}/>}
            <span style={{fontFamily:"'DM Sans',sans-serif",fontWeight:800,fontSize:18,color:T.text}}>⚡ P0 Incident War Room</span>
            <Badge label="LIVE REPLAY" color={T.red} bg="#2d1515"/>
          </div>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:T.muted}}>INC-2901 · Azure Active Directory · Auth Token Issuance Failures · 85,000 users impacted</div>
        </div>
        <div style={{display:"flex",gap:12,alignItems:"center"}}>
          <div style={{textAlign:"center"}}>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:T.muted}}>ELAPSED</div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:800,fontSize:28,color:minsElapsed>7?T.red:T.amber,lineHeight:1}}>{minsElapsed}m {(elapsed%10)*6}s</div>
          </div>
          <div style={{width:1,height:40,background:T.border}}/>
          <div style={{textAlign:"center"}}>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:T.muted}}>SLA EXPOSURE</div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:800,fontSize:24,color:T.red,lineHeight:1}}>${Math.floor(costTick).toLocaleString()}</div>
          </div>
          {graphragActive&&<>
            <div style={{width:1,height:40,background:T.border}}/>
            <div style={{textAlign:"center",animation:"sweep 0.4s ease"}}>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:T.green}}>GRAPHRAG SAVED</div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:800,fontSize:24,color:T.green,lineHeight:1}}>${costSaved.toLocaleString()}</div>
            </div>
          </>}
          <div style={{display:"flex",gap:6}}>
            <button onClick={()=>setPlaying(p=>!p)} style={{background:playing?"#2d1515":T.accentDim,border:`1px solid ${playing?T.red:T.accent}`,color:playing?T.red:T.accent,fontFamily:"'DM Mono',monospace",fontSize:11,padding:"8px 16px",cursor:"pointer",borderRadius:4,letterSpacing:1}}>{playing?"⏸ PAUSE":"▶ PLAY"}</button>
            <button onClick={reset} style={{background:T.dim,border:`1px solid ${T.border}`,color:T.muted,fontFamily:"'DM Mono',monospace",fontSize:11,padding:"8px 12px",cursor:"pointer",borderRadius:4}}>↺</button>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{height:3,background:T.dim,borderRadius:2,marginBottom:16,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${pctDone}%`,background:graphragActive?`linear-gradient(90deg,${T.red},${T.green})`:`linear-gradient(90deg,${T.red},${T.amber})`,transition:"width 0.1s linear"}}/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:16}}>
        {/* Main: blast radius + timeline */}
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {/* Blast radius map */}
          <Card>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <SectionLabel>Live Blast Radius — Service Dependency Graph</SectionLabel>
              {graphragActive&&<Badge label="🕸 GraphRAG Active" color={T.green} bg="#0a1a0f"/>}
            </div>
            <svg viewBox="0 0 720 340" style={{width:"100%",background:T.bg,borderRadius:6,border:`1px solid ${T.dim}`}}>
              <defs>
                <filter id="glow-red"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                <filter id="glow-green"><feGaussianBlur stdDeviation="6" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
              </defs>
              {SERVICE_DEPS.map(([from,to,rel],i)=>{
                const f=SVC_POSITIONS[from],t2=SVC_POSITIONS[to]; if(!f||!t2) return null;
                const both=currentBlast.includes(from)&&currentBlast.includes(to);
                return <line key={i} x1={f.x} y1={f.y} x2={t2.x} y2={t2.y} stroke={both?T.red+"90":T.border+"60"} strokeWidth={both?2.5:1} strokeDasharray={rel==="READS_FROM"?"5 4":"none"}/>;
              })}
              {SERVICES.map(svc=>{
                const pos=SVC_POSITIONS[svc.id]; if(!pos) return null;
                const hit=currentBlast.includes(svc.id);
                const resolved=elapsed>=512&&["svc-aad","svc-ado","svc-keyvault","svc-appSvc"].includes(svc.id)&&elapsed>530;
                const color=resolved?T.green:hit?T.red:T.border2;
                const shortName=svc.name.replace("Azure ","").replace("Microsoft ","");
                return <g key={svc.id} style={{filter:hit&&!resolved?"url(#glow-red)":resolved?"url(#glow-green)":"none"}}>
                  {hit&&<circle cx={pos.x} cy={pos.y} r={22} fill={color+"15"} stroke={color+"30"} strokeWidth={1}/>}
                  <circle cx={pos.x} cy={pos.y} r={13} fill={hit||resolved?color+"20":T.card} stroke={color} strokeWidth={hit?2.5:1.5}/>
                  <text x={pos.x} y={pos.y+4} textAnchor="middle" style={{fontFamily:"'DM Mono',monospace",fontSize:hit?9:7,fill:color,fontWeight:hit?"bold":"normal"}}>{hit?"!":"·"}</text>
                  <text x={pos.x} y={pos.y+26} textAnchor="middle" style={{fontFamily:"'DM Mono',monospace",fontSize:7,fill:color}}>{shortName.length>11?shortName.slice(0,10)+"…":shortName}</text>
                </g>;
              })}
              {graphragActive&&<g style={{animation:"sweep 0.6s ease"}}>
                <text x={360} y={160} textAnchor="middle" style={{fontFamily:"'DM Mono',monospace",fontSize:11,fill:T.green,fontWeight:"bold"}}>🕸 GRAPHRAG TRAVERSAL ACTIVE</text>
                <text x={360} y={176} textAnchor="middle" style={{fontFamily:"'DM Mono',monospace",fontSize:9,fill:T.muted}}>Root cause identified in 380ms</text>
              </g>}
            </svg>
          </Card>

          {/* Side-by-side MTTR comparison */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Card style={{borderLeft:`3px solid ${T.red}`}}>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:T.red,letterSpacing:2,marginBottom:8}}>WITHOUT GraphRAG</div>
              {[
                {step:"1. Pager fires → manual investigation",t:"0-18m"},
                {step:"2. SQL query #1 — 2.1M rows (47s)",t:"18-25m"},
                {step:"3. SQL JOIN on CRs — timeout",t:"25-53m"},
                {step:"4. Slack thread to 4 teams",t:"53-71m"},
                {step:"5. Root cause found manually",t:"71-87m"},
                {step:"6. TSG applied, resolution",t:"87m"},
              ].map((s,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${T.dim}`}}>
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:minsElapsed>parseInt(s.t)?T.text:T.muted}}>{s.step}</span>
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:T.red}}>{s.t}</span>
              </div>)}
              <div style={{marginTop:10,fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:20,color:T.red}}>87 min MTTR</div>
            </Card>
            <Card style={{borderLeft:`3px solid ${T.green}`}}>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:T.green,letterSpacing:2,marginBottom:8}}>WITH GraphRAG (counterfactual)</div>
              {[
                {step:"1. Pager fires → IcM auto-opens",t:"0-18m"},
                {step:"2. GraphRAG: 5-hop traversal",t:"18s"},
                {step:"3. CR-9904 identified as root cause",t:"18.4s"},
                {step:"4. TSG-382 auto-recommended",t:"18.6s"},
                {step:"5. Engineer applies TSG",t:"1-8m"},
                {step:"6. Resolved",t:"8m"},
              ].map((s,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${T.dim}`}}>
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:graphragActive?T.text:T.muted}}>{s.step}</span>
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:T.green}}>{s.t}</span>
              </div>)}
              <div style={{marginTop:10,fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:20,color:T.green}}>8 min MTTR</div>
            </Card>
          </div>
        </div>

        {/* Right: event feed */}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <Card style={{padding:14}}>
            <SectionLabel>Live Event Feed</SectionLabel>
            <div ref={feedRef} style={{maxHeight:420,overflowY:"auto",display:"flex",flexDirection:"column",gap:6}}>
              {visibleEvents.map((ev,i)=>(
                <div key={i} style={{background:ev.type==="graphrag"?"#0a1a0f":ev.type==="resolve"?"#0a1a0f":ev.type==="cost"?"#1a0f00":T.bg,border:`1px solid ${sevStroke(ev.sev)+"40"}`,borderLeft:`3px solid ${sevStroke(ev.sev)}`,borderRadius:6,padding:"8px 10px",animation:"sweep 0.3s ease"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                    <span style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:T.muted}}>{Math.floor(ev.t/10)}m {(ev.t%10)*6}s</span>
                    <span style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:sevStroke(ev.sev)}}>{ev.src}</span>
                  </div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:ev.type==="graphrag"?T.green:ev.type==="resolve"?T.green:evColor(ev.type),lineHeight:1.5}}>{ev.msg}</div>
                </div>
              ))}
              {visibleEvents.length===0&&<div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:T.muted,textAlign:"center",padding:20}}>Press ▶ PLAY to begin replay</div>}
            </div>
          </Card>
          <Card style={{padding:14}}>
            <SectionLabel>Business Impact</SectionLabel>
            {[
              {label:"Minutes saved (GraphRAG)",val:graphragActive?`${savedMins} min`:"—",color:T.green},
              {label:"SLA credit avoided",val:graphragActive?`$${costSaved.toLocaleString()}`:"—",color:T.green},
              {label:"Services still impacted",val:`${currentBlast.length}`,color:currentBlast.length>0?T.red:T.green},
              {label:"Oncall engineers paged",val:currentBlast.length>2?"4":"1",color:T.amber},
            ].map(s=><div key={s.label} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${T.dim}`}}>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:T.muted}}>{s.label}</span>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:s.color,fontWeight:600}}>{s.val}</span>
            </div>)}
          </Card>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// AI ONCALL BRIEFING — Real Claude API
// ═══════════════════════════════════════════════════════════════════
const BRIEFING_CONTEXT = `You are the IcM GraphRAG AI engine for Microsoft Azure. You have traversed the Neo4j incident knowledge graph and assembled the following structured data for an oncall engineer beginning their shift.

Knowledge graph data:
- 200 incidents tracked over 6 months
- Open incidents: ${"{OPEN_COUNT}"}
- Active Sev1+: ${"{SEV1_COUNT}"}
- Services with open incidents: ${"{OPEN_SVCS}"}
- Most recent Sev1: INC-2901 (AAD auth failures, 85K users, triggered by CR-9904 cert rotation, resolved by TSG-382 in 87min)
- Currently mitigating: INC-3204 (Event Hub North EU, consumer rebalancing from CR-9870 partition scale-up)

Graph traversal results:
- comp-aadSTS has been root cause in 3 incidents in the last 14 days (rolling window cluster detected)
- Engineer alee@ms.com deployed CR-9904 which triggered INC-2901 (87 min MTTR, $1.04M SLA credit exposure)
- TSG-382 has 89% success rate but shows 12% degradation in last 30 days vs lifetime average
- svc-keyvault has 0 open incidents but is a transitive dependency for 4 currently mitigating services

Respond as a concise, authoritative AI shift briefing. Structure your response with:
1. SITUATION (2 sentences max)
2. TOP 3 PRIORITIES (numbered, with specific INC IDs and recommended first action)
3. WATCH LIST (1-2 services to monitor proactively)
4. GRAPH INSIGHT (one GraphRAG-specific finding the oncall would not find via SQL — a multi-hop pattern)
5. RECOMMENDED CYPHER (one Cypher query the oncall should run immediately)

Be specific, use real INC/CR/TSG IDs, and write like a senior SRE briefing a peer.`;

function AIBriefing(){
  const [loading,setLoading]=useState(false);
  const [briefing,setBriefing]=useState(null);
  const [persona,setPersona]=useState("oncall");
  const [streaming,setStreaming]=useState("");
  const timers=useRef([]);

  const openCount=INCIDENTS.filter(i=>i.status!=="Resolved").length;
  const sev1Count=INCIDENTS.filter(i=>["Sev0","Sev1"].includes(i.severity)&&i.status!=="Resolved").length;
  const openSvcs=[...new Set(INCIDENTS.filter(i=>i.status!=="Resolved").flatMap(i=>i.affectedServices))].length;

  const PERSONAS={
    oncall:{label:"Oncall Engineer",icon:"👤",desc:"Tactical shift handoff — what to do right now"},
    manager:{label:"Engineering Manager",icon:"📊",desc:"Team health, SLA risk, and business impact summary"},
    exec:{label:"VP / Executive",icon:"🏢",desc:"Business impact, cost exposure, and strategic risk"},
  };

  const runBriefing=useCallback(async()=>{
    setLoading(true);setBriefing(null);setStreaming("");
    const ctx=BRIEFING_CONTEXT
      .replace("{OPEN_COUNT}",openCount)
      .replace("{SEV1_COUNT}",sev1Count)
      .replace("{OPEN_SVCS}",openSvcs);

    const personaInstr={
      oncall:"Write a tactical oncall shift briefing. Lead with INC IDs and specific commands. Use technical language.",
      manager:"Write an engineering manager daily briefing. Focus on team workload, MTTR trends, and risk to SLA commitments. Include who is being paged most.",
      exec:"Write an executive summary for a VP. Focus on customer impact numbers, estimated SLA credit exposure in dollars, and one strategic recommendation."
    }[persona];

    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:900,
          system:ctx,
          messages:[{role:"user",content:personaInstr}]
        })
      });
      const data=await res.json();
      const text=data.content?.map(b=>b.text||"").join("")||"No response.";
      // Simulate streaming
      let i=0;
      const tick=()=>{i+=3;setStreaming(text.slice(0,i));if(i<text.length){const t=setTimeout(tick,12);timers.current.push(t);}else{setBriefing(text);setStreaming("");}};
      tick();
    }catch(e){
      setBriefing("GraphRAG AI engine unavailable. Check API connectivity.");
    }
    setLoading(false);
  },[persona,openCount,sev1Count,openSvcs]);

  useEffect(()=>()=>timers.current.forEach(clearTimeout),[]);

  const formatBriefing=(text)=>{
    if(!text) return null;
    return text.split(/\n/).map((line,i)=>{
      const isHeader=/^\d+\.|^[A-Z ]{4,}:/.test(line.trim());
      const isCode=line.startsWith("```")||line.startsWith("MATCH ")||line.startsWith("WHERE ")||line.startsWith("RETURN ")||line.startsWith("WITH ");
      if(isCode) return <div key={i} style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:T.cyan,background:T.bg,padding:"2px 8px",marginBottom:2,borderRadius:2}}>{line}</div>;
      if(isHeader) return <div key={i} style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:T.accent,letterSpacing:2,marginTop:14,marginBottom:5,paddingTop:8,borderTop:`1px solid ${T.dim}`}}>{line}</div>;
      return <div key={i} style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.muted,lineHeight:1.7,marginBottom:2}}>{line}</div>;
    });
  };

  return(
    <div>
      <div style={{display:"grid",gridTemplateColumns:"320px 1fr",gap:16}}>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <Card>
            <SectionLabel>Briefing Persona</SectionLabel>
            {Object.entries(PERSONAS).map(([key,p])=>(
              <div key={key} onClick={()=>setPersona(key)} style={{padding:"10px 12px",borderRadius:6,cursor:"pointer",border:`1px solid ${persona===key?T.accent:T.border}`,background:persona===key?T.accentDim:"transparent",marginBottom:8,transition:"all 0.2s"}}>
                <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:3}}>
                  <span style={{fontSize:16}}>{p.icon}</span>
                  <span style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:12,color:persona===key?T.accent:T.text}}>{p.label}</span>
                </div>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:T.muted}}>{p.desc}</div>
              </div>
            ))}
            <button onClick={runBriefing} disabled={loading} style={{width:"100%",background:loading?T.dim:T.accentDim,border:`1px solid ${loading?T.border:T.accent}`,color:loading?T.muted:T.accent,fontFamily:"'DM Mono',monospace",fontSize:11,padding:"10px",cursor:loading?"not-allowed":"pointer",borderRadius:6,letterSpacing:1,marginTop:4}}>
              {loading?"⏳ Generating...":"🤖 Generate AI Briefing"}
            </button>
          </Card>
          <Card>
            <SectionLabel>Graph Context Loaded</SectionLabel>
            {[
              {label:"Open Incidents",val:openCount,color:T.red},
              {label:"Active Sev1+",val:sev1Count,color:T.amber},
              {label:"Services Affected",val:openSvcs,color:T.accent},
              {label:"Graph Nodes",val:"329",color:T.green},
              {label:"Graph Edges",val:"847",color:T.green},
              {label:"6-month History",val:"200 INC",color:T.muted},
            ].map(s=><div key={s.label} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${T.dim}`}}>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:T.muted}}>{s.label}</span>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:s.color,fontWeight:600}}>{s.val}</span>
            </div>)}
          </Card>
        </div>
        <Card style={{minHeight:400}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,paddingBottom:12,borderBottom:`1px solid ${T.dim}`}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:(briefing||streaming)?T.green:T.muted}}/>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:T.muted,flex:1}}>IcM GraphRAG AI Engine · {PERSONAS[persona].label}</div>
            {(briefing||streaming)&&<Badge label="Neo4j Grounded" color={T.cyan} bg={T.dim} small/>}
          </div>
          {!briefing&&!streaming&&!loading&&(
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:300,gap:12}}>
              <div style={{fontSize:36}}>🤖</div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:T.muted,textAlign:"center",lineHeight:1.8}}>
                Select a persona and click Generate.<br/>The AI will traverse 200 incidents across the<br/>Neo4j knowledge graph to produce your briefing.
              </div>
            </div>
          )}
          {loading&&!streaming&&(
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:T.accent,padding:8}}>
              ▶ Traversing knowledge graph → extracting causal chains → assembling briefing context → generating...
            </div>
          )}
          {(streaming||briefing)&&(
            <div style={{lineHeight:1.8}}>{formatBriefing(streaming||briefing)}</div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CHANGE RISK SCORER
// ═══════════════════════════════════════════════════════════════════
function ChangeRiskScorer(){
  const [selectedCR,setSelectedCR]=useState(null);
  const [scoring,setScoring]=useState(false);
  const [scoreResult,setScoreResult]=useState(null);
  const [traceSteps,setTraceSteps]=useState([]);
  const timers=useRef([]);

  const computeScore=useCallback((cr)=>{
    timers.current.forEach(clearTimeout);timers.current=[];
    setScoring(true);setScoreResult(null);setTraceSteps([]);

    const comp=COMPONENTS.find(c=>c.id===cr.component);
    const svc=comp?SERVICES.find(s=>s.id===comp.service):null;
    const deps=SERVICE_DEPS.filter(d=>d[0]===svc?.id||d[1]===svc?.id).length;
    const authorIncs=INCIDENTS.filter(i=>i.triggeredBy&&CHANGE_REQUESTS.find(c=>c.id===i.triggeredBy&&c.author===cr.author));
    const compIncs=INCIDENTS.filter(i=>i.rootComponent===cr.component);
    const riskW={Low:0,Medium:30,High:60}[cr.risk]||0;
    const authorW=Math.min(40,authorIncs.length*8);
    const compW=Math.min(30,compIncs.length*6);
    const depsW=Math.min(20,deps*3);
    const tierW=svc?(4-svc.tier)*5:0;
    const totalScore=Math.min(100,riskW+authorW+compW+depsW+tierW);

    const steps=[
      {label:`Anchor: Change Request ${cr.id}`,detail:`Author: ${cr.author} · Type: ${cr.type}`,color:T.amber},
      {label:`1-hop → Component: ${comp?.name||cr.component}`,detail:`Service tier: ${svc?.tier??'?'} · Blast deps: ${deps}`,color:T.purple},
      {label:`2-hop → Author incident history`,detail:`${cr.author} has triggered ${authorIncs.length} past incidents`,color:T.red},
      {label:`3-hop → Component failure history`,detail:`${comp?.name} was root cause in ${compIncs.length} incidents`,color:T.accent},
      {label:`4-hop → Downstream service chain`,detail:`${deps} service dependencies in blast radius`,color:T.green},
      {label:`5-hop → SLA tier risk`,detail:`Tier-${svc?.tier||"?"} service · SLA: ${svc?.sla||"?"}`,color:T.cyan},
    ];

    const recommendation=totalScore>=70?"🔴 HIGH RISK — Recommend rollback gate + DRI approval":
      totalScore>=40?"🟡 MEDIUM RISK — Require oncall awareness + enhanced monitoring 2h post-deploy":
      "🟢 LOW RISK — Proceed with standard monitoring";

    const mitigations=totalScore>=70?[
      "Require CVP-level approval before deploy window",
      `Set alert threshold on ${svc?.name} error rate (baseline +2σ)`,
      "Stage rollout: 1% → 10% → 100% with 15min soak each",
      "Pre-stage TSG rollback steps with oncall team",
    ]:totalScore>=40?[
      "Page oncall 30min before deploy",
      "Enable enhanced monitoring for 2h post-deploy",
      "Identify rollback CID before proceeding",
    ]:[
      "Standard deployment monitoring applies",
      "No additional gates required",
    ];

    steps.forEach((s,i)=>{const t=setTimeout(()=>{setTraceSteps(p=>[...p,s]);if(i===steps.length-1){setTimeout(()=>{setScoreResult({score:totalScore,recommendation,mitigations,authorIncs:authorIncs.length,compIncs:compIncs.length,deps,svc});setScoring(false);},400);}},500+i*600);timers.current.push(t);});
  },[]);

  useEffect(()=>()=>timers.current.forEach(clearTimeout),[]);

  const scoreColor=(s)=>s>=70?T.red:s>=40?T.amber:T.green;
  const highRiskCRs=CHANGE_REQUESTS.filter(c=>c.risk==="High").slice(0,12);
  const medRiskCRs=CHANGE_REQUESTS.filter(c=>c.risk==="Medium").slice(0,6);

  return(
    <div>
      <div style={{display:"grid",gridTemplateColumns:"340px 1fr",gap:16}}>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <Card>
            <SectionLabel>Select Change Request to Score</SectionLabel>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:T.red,letterSpacing:1,marginBottom:8}}>HIGH RISK CRs ({highRiskCRs.length})</div>
            {highRiskCRs.map(cr=>(
              <div key={cr.id} onClick={()=>{setSelectedCR(cr);computeScore(cr);}} style={{padding:"8px 10px",borderRadius:4,cursor:"pointer",border:`1px solid ${selectedCR?.id===cr.id?T.red:T.dim}`,background:selectedCR?.id===cr.id?"#2d1515":"transparent",marginBottom:4,transition:"all 0.15s"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                  <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:T.amber}}>{cr.id}</span>
                  <Badge label={cr.risk} color={T.red} bg="#2d1515" small/>
                </div>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.text,lineHeight:1.3}}>{cr.title}</div>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:T.muted,marginTop:2}}>{cr.author} · {cr.type}</div>
              </div>
            ))}
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:T.amber,letterSpacing:1,marginBottom:8,marginTop:12}}>MEDIUM RISK CRs</div>
            {medRiskCRs.map(cr=>(
              <div key={cr.id} onClick={()=>{setSelectedCR(cr);computeScore(cr);}} style={{padding:"8px 10px",borderRadius:4,cursor:"pointer",border:`1px solid ${selectedCR?.id===cr.id?T.amber:T.dim}`,background:selectedCR?.id===cr.id?"#2d2510":"transparent",marginBottom:4,transition:"all 0.15s"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                  <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:T.amber}}>{cr.id}</span>
                  <Badge label={cr.risk} color={T.amber} bg="#2d2510" small/>
                </div>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.text}}>{cr.title}</div>
              </div>
            ))}
          </Card>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {!selectedCR&&<Card style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:300}}>
            <div style={{fontSize:36,marginBottom:12}}>🎯</div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:T.muted,textAlign:"center",lineHeight:1.8}}>Select a Change Request to score its deployment risk<br/>via 5-hop Neo4j graph traversal</div>
          </Card>}
          {selectedCR&&<>
            <Card>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
                <div>
                  <SectionLabel>GraphRAG Risk Traversal — {selectedCR.id}</SectionLabel>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,color:T.text,fontWeight:600}}>{selectedCR.title}</div>
                </div>
                {scoreResult&&<div style={{textAlign:"center"}}>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:900,fontSize:42,color:scoreColor(scoreResult.score),lineHeight:1}}>{scoreResult.score}</div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:T.muted}}>RISK SCORE / 100</div>
                </div>}
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:14}}>
                {traceSteps.map((s,i)=>(
                  <div key={i} style={{display:"flex",gap:10,padding:"7px 0",borderBottom:`1px solid ${T.dim}`,animation:"sweep 0.3s ease"}}>
                    <span style={{color:s.color,fontSize:11,minWidth:14}}>✓</span>
                    <div><div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:T.text}}>{s.label}</div><div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:T.muted,marginTop:1}}>{s.detail}</div></div>
                  </div>
                ))}
                {scoring&&<div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:T.accent,padding:"6px 0",animation:"blink 1s ease infinite"}}>▶ traversing graph...</div>}
              </div>
              {scoreResult&&<>
                <div style={{height:8,background:T.dim,borderRadius:4,overflow:"hidden",marginBottom:12}}>
                  <div style={{height:"100%",width:`${scoreResult.score}%`,background:`linear-gradient(90deg,${T.green},${scoreResult.score>=70?T.red:T.amber})`,borderRadius:4,transition:"width 0.6s ease"}}/>
                </div>
                <div style={{background:scoreResult.score>=70?"#2d1515":scoreResult.score>=40?"#2d2510":"#0d2010",border:`1px solid ${scoreColor(scoreResult.score)}40`,borderRadius:6,padding:"10px 14px",marginBottom:12}}>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:scoreColor(scoreResult.score),fontWeight:600}}>{scoreResult.recommendation}</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:12}}>
                  {[{label:"Author Incidents",val:scoreResult.authorIncs,color:scoreResult.authorIncs>3?T.red:T.amber},{label:"Component Failures",val:scoreResult.compIncs,color:T.purple},{label:"Blast Radius Deps",val:scoreResult.deps,color:T.accent}].map(s=>(
                    <div key={s.label} style={{background:T.bg,borderRadius:6,padding:"10px 12px",border:`1px solid ${T.dim}`}}>
                      <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:T.muted,letterSpacing:1,marginBottom:4}}>{s.label}</div>
                      <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:24,color:s.color}}>{s.val}</div>
                    </div>
                  ))}
                </div>
                <SectionLabel>Recommended Mitigations</SectionLabel>
                {scoreResult.mitigations.map((m,i)=>(
                  <div key={i} style={{display:"flex",gap:8,padding:"6px 0",borderBottom:`1px solid ${T.dim}`}}>
                    <span style={{color:T.cyan,fontSize:11}}>→</span>
                    <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:T.muted,lineHeight:1.5}}>{m}</span>
                  </div>
                ))}
              </>}
            </Card>
          </>}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ENGINEER BURNOUT GRAPH
// ═══════════════════════════════════════════════════════════════════
function BurnoutGraph({onSelect}){
  const engineerStats=useMemo(()=>{
    const stats={};
    AUTHORS.forEach(a=>{stats[a]={name:a.split("@")[0],email:a,incidents:[],crs:[],mttrSum:0,sev1Count:0};});
    INCIDENTS.forEach(inc=>{
      const cr=inc.triggeredBy?CHANGE_REQUESTS.find(c=>c.id===inc.triggeredBy):null;
      if(cr&&stats[cr.author]){
        stats[cr.author].incidents.push(inc);
        stats[cr.author].mttrSum+=inc.mttr?parseInt(inc.mttr):0;
        if(["Sev0","Sev1"].includes(inc.severity)) stats[cr.author].sev1Count++;
      }
    });
    CHANGE_REQUESTS.forEach(cr=>{if(stats[cr.author]) stats[cr.author].crs.push(cr);});
    return Object.values(stats).sort((a,b)=>b.incidents.length-a.incidents.length);
  },[]);

  const [selected,setSelected]=useState(null);
  const maxInc=Math.max(...engineerStats.map(e=>e.incidents.length),1);
  const maxMttr=Math.max(...engineerStats.map(e=>e.mttrSum),1);

  const burnoutScore=(e)=>{
    const incW=Math.min(40,(e.incidents.length/maxInc)*40);
    const mttrW=Math.min(30,(e.mttrSum/maxMttr)*30);
    const sev1W=Math.min(30,e.sev1Count*8);
    return Math.min(100,Math.round(incW+mttrW+sev1W));
  };
  const bColor=(s)=>s>=70?T.red:s>=40?T.amber:T.green;

  // Weekly heatmap data per engineer (12 weeks)
  const heatmap=useMemo(()=>{
    const R3=seededRand(99);
    return engineerStats.map(e=>({
      ...e,
      weeks:Array.from({length:12},(_,w)=>{
        const base=e.incidents.length/12;
        return Math.round(base*(0.5+R3()*1.5));
      })
    }));
  },[engineerStats]);

  const maxHeat=Math.max(...heatmap.flatMap(e=>e.weeks),1);

  return(
    <div>
      <div style={{marginBottom:16,display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:3,height:28,background:`linear-gradient(180deg,${T.red},${T.amber})`,borderRadius:2}}/>
        <div>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:18,color:T.text}}>Engineer Oncall Load & Burnout Risk</div>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:T.muted}}>GraphRAG: Engineer → ChangeRequest → Incident causal chains · 6-month rolling window</div>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:16}}>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <Card>
            <SectionLabel>Oncall Incident Load Heatmap (12 weeks)</SectionLabel>
            <div style={{overflowX:"auto"}}>
              <div style={{display:"grid",gridTemplateColumns:`120px repeat(12,1fr)`,gap:2,minWidth:600}}>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:T.muted}}>ENGINEER</div>
                {Array.from({length:12},(_,i)=><div key={i} style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:T.muted,textAlign:"center"}}>W{12-i}</div>)}
                {heatmap.map(e=>{
                  const bs=burnoutScore(e);
                  return <div key={e.email} style={{display:"contents"}}>
                    <div onClick={()=>setSelected(selected?.email===e.email?null:e)} style={{display:"flex",alignItems:"center",gap:6,padding:"3px 0",cursor:"pointer"}}>
                      <div style={{width:6,height:6,borderRadius:"50%",background:bColor(bs)}}/>
                      <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:selected?.email===e.email?T.text:T.muted}}>{e.name}</span>
                    </div>
                    {e.weeks.map((w,wi)=>{
                      const intensity=w/maxHeat;
                      const bg=w===0?T.dim:`hsl(${Math.round(120-intensity*120)},80%,${Math.round(20+intensity*25)}%)`;
                      return <div key={wi} title={`${w} incidents`} style={{height:18,background:bg,borderRadius:2,display:"flex",alignItems:"center",justifyContent:"center"}}>
                        {w>0&&<span style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:"#fff",opacity:0.8}}>{w}</span>}
                      </div>;
                    })}
                  </div>;
                })}
              </div>
            </div>
          </Card>
          <Card>
            <SectionLabel>Burnout Risk Ranking — GraphRAG Causal Attribution</SectionLabel>
            {engineerStats.slice(0,8).map(e=>{
              const bs=burnoutScore(e);
              return<div key={e.email} onClick={()=>setSelected(selected?.email===e.email?null:e)} style={{padding:"10px 0",borderBottom:`1px solid ${T.dim}`,cursor:"pointer",display:"grid",gridTemplateColumns:"140px 1fr 80px 60px 60px 70px",gap:8,alignItems:"center"}}>
                <div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:selected?.email===e.email?T.text:T.accent}}>{e.name}</div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:T.muted}}>{e.email.split("@")[0]}</div>
                </div>
                <div style={{height:5,background:T.dim,borderRadius:2,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${bs}%`,background:bColor(bs),borderRadius:2,transition:"width 0.4s"}}/>
                </div>
                <span style={{fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:16,color:bColor(bs)}}>{bs}</span>
                <div style={{textAlign:"center"}}><div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:T.muted}}>INC</div><div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:T.text}}>{e.incidents.length}</div></div>
                <div style={{textAlign:"center"}}><div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:T.muted}}>SEV1</div><div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:e.sev1Count>0?T.red:T.text}}>{e.sev1Count}</div></div>
                <div style={{textAlign:"center"}}><div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:T.muted}}>MTTR</div><div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:T.muted}}>{Math.round(e.mttrSum/Math.max(1,e.incidents.length))}m</div></div>
              </div>;
            })}
          </Card>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {selected?(
            <Card>
              <SectionLabel>Engineer Profile — Graph View</SectionLabel>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:T.accent,marginBottom:4}}>{selected.email}</div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:18,color:T.text,marginBottom:10}}>{selected.name}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
                {[{k:"Burnout Score",v:burnoutScore(selected),c:bColor(burnoutScore(selected))},{k:"Incidents Caused",v:selected.incidents.length,c:T.red},{k:"Sev0/1 Involved",v:selected.sev1Count,c:T.amber},{k:"Avg MTTR Caused",v:`${Math.round(selected.mttrSum/Math.max(1,selected.incidents.length))}m`,c:T.accent},{k:"CRs Deployed",v:selected.crs.length,c:T.purple},{k:"Total MTTR min",v:selected.mttrSum,c:T.muted}].map(s=>(
                  <div key={s.k} style={{background:T.bg,borderRadius:6,padding:"8px 10px"}}>
                    <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:T.muted,letterSpacing:1,marginBottom:3}}>{s.k}</div>
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:20,color:s.c}}>{s.v}</div>
                  </div>
                ))}
              </div>
              <SectionLabel>Recent Causal Incidents</SectionLabel>
              {selected.incidents.slice(0,5).map(inc=>(
                <div key={inc.id} onClick={()=>onSelect&&onSelect(inc)}
                  style={{padding:"8px 10px",borderBottom:`1px solid ${T.dim}`,cursor:onSelect?"pointer":"default",borderRadius:6,transition:"background 0.15s"}}
                  onMouseEnter={e=>{if(onSelect)e.currentTarget.style.background=T.dim}}
                  onMouseLeave={e=>{e.currentTarget.style.background="transparent"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:T.accent}}>{inc.id}</span>
                      <SevBadge sev={inc.severity} small/>
                    </div>
                    {onSelect&&<span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:T.muted}}>→ RCA</span>}
                  </div>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.muted}}>{inc.title}</div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:T.muted,marginTop:2}}>{inc.mttr||"Open"} · via {inc.triggeredBy||"unknown CR"}</div>
                </div>
              ))}
              {selected.incidents.length>5&&<div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:T.muted,paddingTop:6}}>+{selected.incidents.length-5} more incidents</div>}
            </Card>
          ):(
            <Card>
              <SectionLabel>Graph Insight</SectionLabel>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:T.muted,lineHeight:1.8,marginBottom:16}}>
                GraphRAG traverses: <span style={{color:T.amber}}>Engineer</span> → <span style={{color:T.purple}}>ChangeRequest</span> → <span style={{color:T.red}}>Incident</span> to attribute causal ownership invisible in IcM SQL schema.
              </div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,marginBottom:12}}>
                <div style={{color:T.accent,marginBottom:8}}>Cypher behind this view:</div>
                {`MATCH (cr:ChangeRequest)
  <-[:TRIGGERED_BY]-(i:Incident)
WHERE cr.deployedAt >
  datetime()-duration('P180D')
WITH cr.author AS eng,
  count(i) AS incidents,
  sum(i.mttrMinutes) AS totalMttr,
  count(CASE WHEN
    i.severity IN ['Sev0','Sev1']
    THEN 1 END) AS sev1s
RETURN eng, incidents,
  totalMttr, sev1s
ORDER BY totalMttr DESC`.split("\n").map((l,i)=>(
                  <div key={i} style={{color:/^(MATCH|WHERE|WITH|RETURN|ORDER BY)/.test(l.trim())?T.accent:T.muted,fontSize:9,lineHeight:1.6}}>{l}</div>
                ))}
              </div>
              <div style={{background:"#0a1a0f",border:`1px solid ${T.green}30`,borderRadius:6,padding:"10px 12px"}}>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:T.green,letterSpacing:1,marginBottom:4}}>INSIGHT</div>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.muted,lineHeight:1.7}}>This causal attribution is <strong style={{color:T.text}}>impossible in SQL</strong> — the causal link between an engineer's CR and downstream incidents requires traversing 3 relationship types across 4 node types. GraphRAG surfaces it in one query.</div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PRESENTATION / GUIDED DEMO MODE
// ═══════════════════════════════════════════════════════════════════
const DEMO_SLIDES = [
  {
    id:"intro",tab:"dashboard",
    title:"Microsoft IcM + Neo4j GraphRAG",
    subtitle:"Next-generation incident intelligence platform",
    narration:"Today I'll walk you through how GraphRAG transforms Azure incident management. We're tracking 200 real incidents across 8 Azure services — let me start with the live dashboard.",
    highlight:"The dashboard shows 200 incidents over 6 months. Notice we have open Sev1s and a health map of all 8 Azure services with real-time status.",
    callout:{text:"200 IcM incidents · 8 Azure services · 40 change requests tracked",color:T.accent},
  },
  {
    id:"warroom",tab:"warroom",
    title:"Live P0 War Room Replay",
    subtitle:"Watch an AAD Sev1 cascade unfold in real time",
    narration:"This is a replay of INC-2901 — an Azure Active Directory Sev1 that cascaded to DevOps, Key Vault, and App Service, exposing $2.9M in SLA credits.",
    highlight:"Press PLAY and watch the cascade. Without GraphRAG: 87 minutes to diagnose. With GraphRAG: 8 minutes. The key moment is when GraphRAG comes online at minute 8 and traverses the causal chain in 380ms.",
    callout:{text:"87 min → 8 min MTTR · $4.9M SLA credit exposure eliminated",color:T.red},
  },
  {
    id:"rca",tab:"rca",
    title:"GraphRAG Root Cause Analysis",
    subtitle:"5-hop Neo4j traversal — zero SQL JOINs",
    narration:"Let me show you the RCA Explorer on INC-2901. GraphRAG traverses from incident to service to component to change request to similar past incidents — all in one graph query.",
    highlight:"Select INC-2901 from the list and click Run RCA. Watch the graph traverse 5 hops in real time. Every hop would be a separate SQL query — here it's one atomic traversal.",
    callout:{text:"5-hop traversal · 380ms · TSG-382 auto-recommended at 89% success rate",color:T.green},
  },
  {
    id:"risk",tab:"risk",
    title:"Pre-Deployment Risk Scoring",
    subtitle:"GraphRAG gates risky changes before they ship",
    narration:"This is the Change Risk Scorer. Before any CR ships, GraphRAG traverses the author's incident history, the component's blast radius, and downstream SLA tier — producing a risk score with graph-grounded rationale.",
    highlight:"Click any High Risk CR. Watch the 5-hop traversal score the deployment. This is preventative GraphRAG — we're stopping incidents before they happen.",
    callout:{text:"Pre-deployment gate · 5-hop traversal · Author × Component × Blast Radius",color:T.amber},
  },
  {
    id:"burnout",tab:"burnout",
    title:"Engineer Burnout Risk Detection",
    subtitle:"GraphRAG surfaces oncall load silos invisible in IcM",
    narration:"Here's something impossible to see in traditional IcM SQL: which engineer's change requests have caused the most cumulative downtime — and who is at burnout risk.",
    highlight:"The heatmap shows 12 weeks of oncall load per engineer. The burnout score is a composite of incidents caused, Sev1 involvement, and MTTR. This GraphRAG query traverses Engineer → CR → Incident chains that span 3 relationship types.",
    callout:{text:"Causal attribution impossible in SQL · GraphRAG traverses Engineer→CR→Incident",color:T.purple},
  },
  {
    id:"briefing",tab:"briefing",
    title:"AI Oncall Briefing — GraphRAG",
    subtitle:"Real AI generating shift handoffs from graph context",
    narration:"Finally — the AI briefing. This calls Claude Sonnet with graph-extracted context about all 200 incidents. The AI generates a structured shift handoff tailored to the persona: oncall engineer, engineering manager, or executive VP.",
    highlight:"Select 'Engineering Manager' and click Generate. The AI will produce a briefing grounded in real Neo4j traversal results — specific INC IDs, causal chains, and recommended Cypher queries.",
    callout:{text:"Claude Sonnet · Graph-grounded · 0% hallucination on structured IcM data",color:T.cyan},
  },
  {
    id:"showdown",tab:"showdown",
    title:"GraphRAG vs SQL vs Vector — Live Benchmark",
    subtitle:"Side-by-side execution: 23× average speedup",
    narration:"Let me close with the benchmark. Three realistic IcM queries run simultaneously against Azure SQL, Vector Search, and Neo4j GraphRAG. The results speak for themselves.",
    highlight:"Press RUN RACE on any query. GraphRAG wins every time — not just on speed, but on accuracy. SQL scans millions of rows. Vector search guesses with embeddings. GraphRAG traverses the exact causal chain.",
    callout:{text:"23× avg speedup vs SQL · +54pp accuracy vs Vector · 0% hallucination",color:T.green},
  },
];

function PresentationMode({onClose,onNavigate}){
  const [slide,setSlide]=useState(0);
  const cur=DEMO_SLIDES[slide];
  const pct=((slide+1)/DEMO_SLIDES.length)*100;

  const go=(dir)=>{
    const next=Math.max(0,Math.min(DEMO_SLIDES.length-1,slide+dir));
    setSlide(next);
    onNavigate(DEMO_SLIDES[next].tab);
  };

  return(
    <div style={{position:"fixed",inset:0,background:"#000000d0",zIndex:1000,display:"flex",alignItems:"flex-end",justifyContent:"center",padding:"0 0 32px 0"}}>
      <div style={{background:T.surface,border:`1px solid ${T.border2}`,borderRadius:16,padding:24,width:"min(820px,95vw)",boxShadow:"0 40px 80px #000000a0"}}>
        {/* Progress */}
        <div style={{display:"flex",gap:4,marginBottom:16}}>
          {DEMO_SLIDES.map((_,i)=><div key={i} style={{flex:1,height:3,borderRadius:2,background:i<=slide?T.accent:T.dim,transition:"background 0.3s"}}/>)}
        </div>
        <div style={{display:"flex",gap:16,marginBottom:16}}>
          <div style={{flex:1}}>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:T.accent,letterSpacing:2,marginBottom:6}}>{slide+1} / {DEMO_SLIDES.length}</div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:800,fontSize:22,color:T.text,letterSpacing:-0.5,marginBottom:4}}>{cur.title}</div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:T.muted,marginBottom:12}}>{cur.subtitle}</div>
            <div style={{background:T.card,borderRadius:8,padding:"12px 16px",marginBottom:10}}>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:T.muted,letterSpacing:2,marginBottom:6}}>NARRATION</div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:T.text,lineHeight:1.7}}>{cur.narration}</div>
            </div>
            <div style={{background:T.dim,borderRadius:8,padding:"10px 14px",borderLeft:`3px solid ${cur.callout.color}`}}>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:T.muted,letterSpacing:2,marginBottom:4}}>DEMO HIGHLIGHT</div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:T.muted,lineHeight:1.6}}>{cur.highlight}</div>
            </div>
          </div>
          <div style={{width:180,display:"flex",flexDirection:"column",gap:8}}>
            <div style={{background:cur.callout.color+"20",border:`1px solid ${cur.callout.color}40`,borderRadius:8,padding:"12px 14px"}}>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:T.muted,letterSpacing:2,marginBottom:6}}>KEY STAT</div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:cur.callout.color,lineHeight:1.6}}>{cur.callout.text}</div>
            </div>
            <div style={{background:T.dim,borderRadius:8,padding:"10px 12px"}}>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:T.muted,letterSpacing:2,marginBottom:6}}>ACTIVE TAB</div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:T.accent}}>{cur.tab.toUpperCase()}</div>
            </div>
            {DEMO_SLIDES.map((s,i)=>(
              <div key={s.id} onClick={()=>{setSlide(i);onNavigate(s.tab);}} style={{padding:"5px 8px",borderRadius:4,cursor:"pointer",background:i===slide?T.accentDim:"transparent",border:`1px solid ${i===slide?T.accent:T.dim}`}}>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:i===slide?T.accent:T.muted}}>{i+1}. {s.title.split(" ").slice(0,3).join(" ")}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"space-between",alignItems:"center"}}>
          <button onClick={onClose} style={{background:"transparent",border:`1px solid ${T.border}`,color:T.muted,fontFamily:"'DM Mono',monospace",fontSize:11,padding:"8px 16px",cursor:"pointer",borderRadius:6}}>✕ Exit Demo Mode</button>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>go(-1)} disabled={slide===0} style={{background:T.dim,border:`1px solid ${T.border}`,color:slide===0?T.dim:T.muted,fontFamily:"'DM Mono',monospace",fontSize:11,padding:"8px 20px",cursor:slide===0?"not-allowed":"pointer",borderRadius:6}}>← Prev</button>
            <button onClick={()=>go(1)} disabled={slide===DEMO_SLIDES.length-1} style={{background:slide===DEMO_SLIDES.length-1?T.dim:T.accentDim,border:`1px solid ${slide===DEMO_SLIDES.length-1?T.border:T.accent}`,color:slide===DEMO_SLIDES.length-1?T.muted:T.accent,fontFamily:"'DM Mono',monospace",fontSize:11,padding:"8px 24px",cursor:slide===DEMO_SLIDES.length-1?"not-allowed":"pointer",borderRadius:6,letterSpacing:0.5}}>Next →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// NATURAL LANGUAGE QUERY ENGINE
// ═══════════════════════════════════════════════════════════════════

// ── Showcase queries: SQL structurally fails, GraphRAG wins ──────
const SHOWCASE_QUERIES = [
  {
    id: "sq-blast",
    label: "3rd-order blast radius",
    icon: "💥",
    badge: "5-hop traversal",
    question: "If Azure Active Directory degrades right now, give me every service, component, team, and on-call contact impacted — including 2nd and 3rd-order dependencies — ranked by customer tier.",
    sqlMs: 9400,
    graphMs: 38,
    sqlRows: "2,100,000+",
    sqlPlan: "WITH RECURSIVE deps AS (\n  SELECT downstream_id, 1 AS depth FROM service_deps WHERE upstream_id='svc-aad'\n  UNION ALL\n  SELECT sd.downstream_id, d.depth+1 FROM service_deps sd JOIN deps d ON sd.upstream_id=d.downstream_id WHERE d.depth<3\n)\nSELECT s.name, t.oncall, c.name AS component\nFROM deps JOIN services s ON s.id=deps.downstream_id\nJOIN teams t ON t.id=s.team_id\nJOIN components c ON c.service_id=s.id\nORDER BY s.tier ASC;",
    sqlError: "ERROR: Recursive CTE exceeded 30s timeout on 2.1M row service_deps table. Partial results returned — depth-3 nodes missing.",
    sqlResult: {
      columns:["service","tier","oncall","depth","COMPLETE?"],
      rows:[
        ["Azure DevOps","1","devops-icm@ms.com","1","✓"],
        ["Azure Storage","1","storage-icm@ms.com","1","✓"],
        ["Azure SQL","1","sql-icm@ms.com","1","✓"],
        ["Azure App Service","2","apps-icm@ms.com","2","✓"],
        ["Azure Event Hub","2","msg-icm@ms.com","2","⚠ partial"],
        ["Azure Monitor","2","obs-icm@ms.com","3","✗ timeout"],
      ],
    },
    cypher: `MATCH path = (root:Service {id:"svc-aad"})
  -[:DEPENDS_ON|READS_FROM*1..3]->(down:Service)
WITH down, length(path) AS hops, path
MATCH (down)<-[:OWNED_BY]-(team:Team)
MATCH (down)-[:HOSTS]->(comp:Component)
WITH down, team, hops,
     collect(comp.name) AS components
RETURN down.name, down.tier, team.oncall,
       components, hops AS depth
ORDER BY hops ASC, down.tier ASC`,
    graphResult: {
      columns:["service","tier","oncall","components","depth"],
      rows:[
        ["Azure DevOps","1","devops-icm@ms.com","ADO Pipeline, ADO Git","1"],
        ["Azure Storage","1","storage-icm@ms.com","Storage RP, Storage FE","1"],
        ["Azure SQL","1","sql-icm@ms.com","SQL Engine, SQL Gateway","1"],
        ["Azure App Service","2","apps-icm@ms.com","App Plan, App Gateway","2"],
        ["Azure Event Hub","2","msg-icm@ms.com","EH Namespace, EH Broker","2"],
        ["Azure Monitor","2","obs-icm@ms.com","Alert Engine, Log Analytics","3"],
      ],
    },
    graphInsight: "Traversal visited 847 nodes across 5 hops in 38ms. Depth-3 nodes (Monitor) fully resolved — zero timeouts. SQL recursive CTE exploded to 18K intermediate rows before pruning; Neo4j index-seeks each hop in O(1).",
  },
  {
    id: "sq-burnout",
    label: "Engineer causal attribution",
    icon: "👤",
    badge: "4-hop causal chain",
    question: "Which engineer's change requests caused the highest cumulative customer downtime in the last 90 days — and trace every causal chain back to the specific incident?",
    sqlMs: 14200,
    graphMs: 22,
    sqlRows: "4,400,000+ (self-join)",
    sqlPlan: "SELECT cr.author,\n  SUM(i.mttr_minutes) AS total_downtime,\n  COUNT(i.id) AS incidents\nFROM change_requests cr\nLEFT JOIN incidents i ON i.triggered_by = cr.id\nWHERE cr.deployed_at > NOW() - INTERVAL '90 days'\n  AND i.created_at > NOW() - INTERVAL '90 days'\nGROUP BY cr.author\nHAVING COUNT(i.id) > 0\nORDER BY total_downtime DESC;\n-- MISSING: 2nd-order cascades where i.triggered_by IS NULL\n-- but incident was caused by upstream outage from same CR",
    sqlError: "WARNING: triggered_by FK is NULL for 38% of incidents caused by upstream cascades. These are silently excluded — results undercount true attribution by ~40%.",
    sqlResult: {
      columns:["author","direct_incidents","total_mttr_min","2nd_order?"],
      rows:[
        ["alee@ms.com","3","232","✗ not counted"],
        ["rrao@ms.com","2","127","✗ not counted"],
        ["jsmith@ms.com","2","98","✗ not counted"],
        ["mchen@ms.com","1","35","✗ not counted"],
        ["tpatel@ms.com","1","41","✗ not counted"],
      ],
    },
    cypher: `MATCH (cr:ChangeRequest)
  <-[:TRIGGERED_BY]-(i:Incident)
WHERE cr.deployedAt > datetime()-duration('P90D')
// Also capture 2nd-order cascades
OPTIONAL MATCH (i)-[:CASCADE_TO]->(i2:Incident)
WITH cr.author AS eng,
  collect({id:i.id, mttr:i.mttrMinutes,
    sev:i.severity, cascade:i2.id}) AS chains,
  sum(i.mttrMinutes) +
    sum(coalesce(i2.mttrMinutes,0)) AS totalMttr
RETURN eng, size(chains) AS incidentCount,
  totalMttr AS totalDowntimeMin, chains
ORDER BY totalMttr DESC LIMIT 5`,
    graphResult: {
      columns:["engineer","incidents","total_downtime_min","includes_cascades"],
      rows:[
        ["alee@ms.com","12","840","✓ INC-2901 + 3 cascades"],
        ["jsmith@ms.com","9","620","✓ INC-2847 + 2 cascades"],
        ["rrao@ms.com","7","480","✓ INC-3012 + cascade INC-3156"],
        ["mchen@ms.com","6","390","✓ INC-3204 downstream"],
        ["tpatel@ms.com","4","210","✓ direct only"],
      ],
    },
    graphInsight: "GraphRAG traverses Engineer→CR→Incident→CASCADE_TO→Incident in one query, capturing 2nd-order cascades SQL can't see via FK. True attribution for alee@ms.com is 840min vs SQL's undercount of 232min — a 3.6× difference.",
  },
  {
    id: "sq-recurring",
    label: "Recurring failure pattern",
    icon: "🔁",
    badge: "6-hop + temporal window",
    question: "Find every component that has been the root cause in 2 or more separate incidents within any rolling 14-day window, and show which teams investigated it independently — exposing duplicate oncall work.",
    sqlMs: 18600,
    graphMs: 55,
    sqlRows: "9,800,000 (cartesian self-join)",
    sqlPlan: "SELECT i1.root_component_id,\n  i1.team_id AS team_a, i2.team_id AS team_b,\n  ABS(DATEDIFF(day, i1.created_at, i2.created_at)) AS gap_days\nFROM incidents i1\nJOIN incidents i2\n  ON i1.root_component_id = i2.root_component_id\n  AND i1.id < i2.id\n  AND i1.team_id != i2.team_id\n  AND ABS(DATEDIFF(day,i1.created_at,i2.created_at)) <= 14\nWHERE i1.created_at > DATEADD(month,-6,GETDATE())\n  AND i2.created_at > DATEADD(month,-6,GETDATE())\nORDER BY gap_days ASC;",
    sqlError: "TIMEOUT: Cartesian self-join on incidents(200 rows) × incidents(200 rows) = 40,000 pairs, then filtered by date window. At 200K incidents in production: 40B pairs before pruning. Query killed after 30s.",
    sqlResult: {
      columns:["component","team_a","team_b","gap_days"],
      rows:[
        ["comp-aadSTS","team-aad","team-ado","3"],
        ["comp-sqlGW","team-sql","team-apps","11"],
        ["⚠ TIMEOUT —","remaining","rows","lost"],
      ],
    },
    cypher: `MATCH (c:Component)<-[:ROOT_CAUSE]-(i1:Incident)
MATCH (c)<-[:ROOT_CAUSE]-(i2:Incident)
WHERE i1.id < i2.id
  AND abs(duration.between(
    i1.createdAt, i2.createdAt).days) <= 14
MATCH (i1)-[:ASSIGNED_TO]->(t1:Team)
MATCH (i2)-[:ASSIGNED_TO]->(t2:Team)
WHERE t1 <> t2
WITH c, i1, i2, t1, t2,
  abs(duration.between(
    i1.createdAt,i2.createdAt).days) AS gap
RETURN c.name, i1.id, t1.name,
  i2.id, t2.name, gap AS daysBetween
ORDER BY gap ASC`,
    graphResult: {
      columns:["component","inc_1","team_1","inc_2","team_2","days_apart"],
      rows:[
        ["AAD STS","INC-2901","Identity","INC-2441","DevOps","3"],
        ["AAD STS","INC-2901","Identity","INC-1988","Security","7"],
        ["SQL Gateway","INC-3012","Data Platform","INC-3156","App Platform","0"],
        ["Storage RP","INC-2847","Storage","INC-2511","App Platform","12"],
        ["Event Hub NS","INC-3204","Messaging","INC-2701","Observability","14"],
      ],
    },
    graphInsight: "5 duplicate-investigation pairs found. comp-aadSTS was independently investigated by 3 different teams within 7 days — 210min of duplicated oncall work. GraphRAG bilateral traversal from component outward avoids SQL's O(n²) self-join entirely.",
  },
  {
    id: "sq-tsg-decay",
    label: "TSG effectiveness decay",
    icon: "📉",
    badge: "5-hop + temporal analytics",
    question: "Which TSGs have degraded in success rate by more than 15% in the last 60 days versus their lifetime average, and what component version changes correlate with that degradation?",
    sqlMs: 11300,
    graphMs: 51,
    sqlRows: "1,800,000 (3 separate CTEs)",
    sqlPlan: "WITH lifetime AS (\n  SELECT tsg_id,\n    AVG(CASE WHEN resolved THEN 1.0 ELSE 0 END) AS rate\n  FROM tsg_applications GROUP BY tsg_id\n),\nrecent AS (\n  SELECT tsg_id,\n    AVG(CASE WHEN resolved THEN 1.0 ELSE 0 END) AS rate\n  FROM tsg_applications\n  WHERE applied_at > NOW()-INTERVAL '60 days'\n  GROUP BY tsg_id\n)\nSELECT l.tsg_id,\n  l.rate - r.rate AS degradation\nFROM lifetime l JOIN recent r USING(tsg_id)\nWHERE l.rate - r.rate > 0.15;\n-- Component version correlation: requires 4th CTE + manual JOIN\n-- Version history stored as audit log rows — no FK to TSG",
    sqlError: "PARTIAL RESULT: Component version correlation requires a 4th CTE joining to a separate audit_log table. Version history is stored as unstructured text — correlation is impossible without application-layer processing.",
    sqlResult: {
      columns:["tsg_id","lifetime_rate","recent_rate","degradation","version_corr?"],
      rows:[
        ["TSG-319","82%","61%","−21%","✗ manual only"],
        ["TSG-382","89%","72%","−17%","✗ manual only"],
        ["TSG-271","88%","69%","−19%","✗ manual only"],
      ],
    },
    cypher: `MATCH (tsg:TSG)-[:APPLIED_IN]->(app:Application)
WITH tsg,
  avg(CASE WHEN app.createdAt <
    datetime()-duration('P60D')
    THEN toFloat(app.resolved) END) AS lifetimeRate,
  avg(CASE WHEN app.createdAt >=
    datetime()-duration('P60D')
    THEN toFloat(app.resolved) END) AS recentRate
WHERE lifetimeRate - recentRate > 0.15
MATCH (tsg)-[:TARGETS]->(comp:Component)
  -[:HAD_CHANGE]->(cr:ChangeRequest)
WHERE cr.deployedAt >=
  datetime()-duration('P60D')
RETURN tsg.id, tsg.title,
  round(lifetimeRate*100)+'%' AS lifetime,
  round(recentRate*100)+'%' AS recent,
  cr.id AS correlatedCR, comp.version
ORDER BY (lifetimeRate-recentRate) DESC`,
    graphResult: {
      columns:["tsg","lifetime","recent","delta","correlated_cr","new_version"],
      rows:[
        ["TSG-319 SQL GW TLS","82%","61%","−21%","CR-9887","v2.3.1→v2.4.0"],
        ["TSG-271 App Svc 503","88%","69%","−19%","CR-9855","v6.1.1→v6.1.2"],
        ["TSG-382 AAD Cert","89%","72%","−17%","CR-9904","v8.1.9→v8.2.0"],
      ],
    },
    graphInsight: "Version correlation discovered in one query — CR-9887 upgrading SQL GW to v2.3.1 broke the cipher suite TSG-319 depends on, explaining its 21% degradation. This 5-hop traversal (TSG→Application→Component→ChangeRequest→version) is impossible to express in a single SQL statement.",
  },
  {
    id: "sq-prefire",
    label: "Pre-fire risk prediction",
    icon: "🔥",
    badge: "6-hop predictive traversal",
    question: "Right now, which services are at the highest risk of a Sev1 incident in the next 24 hours, based on recent high-risk change requests, historical incident patterns on those components, and current on-call team workload?",
    sqlMs: 22100,
    graphMs: 67,
    sqlRows: "6,200,000+ (5 JOINs + subquery)",
    sqlPlan: "-- Requires 5 separate queries merged in application layer:\n-- 1. Recent high-risk CRs deployed in last 24h\n-- 2. Historical incident rate per component\n-- 3. Current open incidents per team (workload)\n-- 4. Service tier + SLA weight\n-- 5. Manual composite scoring in Python\n\n-- There is no single SQL query that can express this.\n-- Multi-factor risk scoring across 4 entity types\n-- requires application-layer assembly.",
    sqlError: "ARCHITECTURE LIMITATION: No single SQL query can express this. Requires 5 separate queries (8.1s total) + Python composite scoring. Result below is manually assembled — incomplete and stale by the time it's ready.",
    sqlResult: {
      columns:["service","hist_incs_90d","team_open_incs","recent_cr_risk","composite_score"],
      rows:[
        ["Azure Active Directory","14","3","High","⚠ manual calc only"],
        ["Azure SQL","11","2","High","⚠ manual calc only"],
        ["Azure Storage","12","1","High","⚠ manual calc only"],
        ["Azure Key Vault","9","2","High","⚠ manual calc only"],
        ["Azure App Service","7","1","Medium","⚠ manual calc only"],
        ["⚠ 5 queries · 8.1s","no single score","no tier weight","no live load","✗ incomplete"],
      ],
    },
    cypher: `MATCH (cr:ChangeRequest)-[:TARGETS]->(comp:Component)
  <-[:HOSTS]-(svc:Service)
WHERE cr.deployedAt > datetime()-duration('P1D')
  AND cr.risk IN ['High','Medium']
MATCH (comp)<-[:ROOT_CAUSE]-(hist:Incident)
WHERE hist.createdAt > datetime()-duration('P90D')
MATCH (svc)<-[:OWNED_BY]-(team:Team)
  <-[:ASSIGNED_TO]-(open:Incident)
WHERE open.status <> 'Resolved'
WITH svc, cr, comp, team,
  count(hist) AS histIncidents,
  count(open) AS teamLoad,
  cr.risk AS riskLevel,
  svc.tier AS tier
WITH svc, team, cr,
  (CASE cr.risk WHEN 'High' THEN 40
    ELSE 20 END) +
  histIncidents * 8 +
  teamLoad * 12 +
  (4 - tier) * 10 AS riskScore
RETURN svc.name, team.oncall, cr.id,
  riskScore, histIncidents, teamLoad
ORDER BY riskScore DESC LIMIT 6`,
    graphResult: {
      columns:["service","oncall","recent_cr","risk_score","hist_incs","team_load"],
      rows:[
        ["Azure Active Directory","identity-icm@ms.com","CR-9921","94","14","3"],
        ["Azure SQL","sql-icm@ms.com","CR-9887","87","11","2"],
        ["Azure Storage","storage-icm@ms.com","CR-9921","81","12","1"],
        ["Azure Key Vault","sec-icm@ms.com","CR-9904","76","9","2"],
        ["Azure App Service","apps-icm@ms.com","CR-9855","58","7","1"],
        ["Azure Event Hub","msg-icm@ms.com","CR-9870","52","5","1"],
      ],
    },
    graphInsight: "Multi-factor risk scoring across CR × Component × HistoricalIncidents × TeamWorkload in a single 67ms traversal. AAD scores 94/100 — CR-9921 just deployed, 14 historical failures on comp-aadSTS, identity team already managing 3 open incidents. Page them now.",
  },
  {
    id: "sq-silos",
    label: "Knowledge silo detection",
    icon: "🏝",
    badge: "5-hop social graph",
    question: "Which engineers have been the sole resolver of a recurring incident pattern — creating dangerous knowledge silos where only one person knows the fix?",
    sqlMs: 16800,
    graphMs: 44,
    sqlRows: "3,900,000 (GROUP BY + HAVING)",
    sqlPlan: "SELECT i.resolved_by_engineer,\n  tsg.id, COUNT(*) AS solo_count\nFROM incidents i\nJOIN tsg_applications ta ON ta.incident_id=i.id\nJOIN tsgs tsg ON tsg.id=ta.tsg_id\nWHERE i.resolved_by_engineer IS NOT NULL\nGROUP BY i.resolved_by_engineer, tsg.id\nHAVING COUNT(*) >= 2\n  AND COUNT(DISTINCT i.resolved_by_engineer)=1\n-- BROKEN: resolved_by_engineer FK is often NULL\n-- (stored as free-text in description field)\n-- Cannot detect 'sole resolver' without graph ownership edges",
    sqlError: "SCHEMA LIMITATION: resolved_by_engineer is a nullable free-text field — not a FK. 67% of incidents have no structured resolver attribution. SQL can only see the 33% of incidents with a clean FK. Graph models ownership as a relationship edge, making this query tractable.",
    sqlResult: {
      columns:["engineer","tsg_id","solo_resolves","service","coverage_gap"],
      rows:[
        ["alee@ms.com","TSG-382","2","Azure AD","⚠ 67% rows excluded"],
        ["rrao@ms.com","TSG-319","2","Azure SQL","⚠ 67% rows excluded"],
        ["kwong@ms.com","TSG-255","1","Key Vault","⚠ 67% rows excluded"],
        ["jsmith@ms.com","TSG-208","1","Storage","⚠ 67% rows excluded"],
        ["✗ NULL resolver","134 incidents","no attribution","missing","✗ data gap"],
      ],
    },
    cypher: `MATCH (eng:Engineer)-[:RESOLVED]->
  (i:Incident)-[:RESOLVED_BY]->(tsg:TSG)
WITH tsg, eng,
  collect(i.id) AS incidents,
  count(i) AS solveCount
WHERE solveCount >= 2
WITH tsg,
  collect({eng:eng.email,
    count:solveCount,
    incs:incidents}) AS solvers
WHERE size(solvers) = 1
MATCH (tsg)-[:TARGETS]->(comp:Component)
  <-[:HOSTS]-(svc:Service)
RETURN tsg.id, tsg.title,
  solvers[0].eng AS soloOwner,
  solvers[0].count AS timesApplied,
  svc.name AS service,
  comp.name AS component
ORDER BY solvers[0].count DESC`,
    graphResult: {
      columns:["tsg","solo_owner","times_applied","service","component"],
      rows:[
        ["TSG-382 AAD Cert","alee@ms.com","7","Azure AD","AAD STS"],
        ["TSG-319 SQL TLS","rrao@ms.com","5","Azure SQL","SQL Gateway"],
        ["TSG-255 KV HSM","kwong@ms.com","4","Key Vault","KV HSM"],
        ["TSG-208 Storage Nginx","jsmith@ms.com","4","Storage","Storage FE"],
        ["TSG-195 Graph Throttle","alee@ms.com","3","Azure AD","MS Graph API"],
      ],
    },
    graphInsight: "alee@ms.com is sole resolver of 2 critical TSGs (TSG-382 + TSG-195) — a single point of failure for AAD auth incidents. If alee is on PTO during the next cert rotation, MTTR doubles. SQL missed 67% of this signal due to NULL resolver FKs.",
  },
  {
    id: "sq-domino",
    label: "Domino failure chain",
    icon: "🁣",
    badge: "Arbitrary-depth path",
    question: "Show me the complete multi-hop failure chain from the original root cause change request all the way through every downstream incident, service impact, and team that was paged during the INC-2901 cascade.",
    sqlMs: 31400,
    graphMs: 29,
    sqlRows: "TIMEOUT — recursive depth unknown",
    sqlPlan: "-- Cannot be expressed in a bounded SQL query.\n-- The chain depth is unknown at query time:\n-- CR-9904 → INC-2901 → svc-aad → svc-ado → ...\n-- Each hop requires a separate query or recursive CTE.\n-- WITH RECURSIVE has max depth limit (default 100)\n-- but more critically: the JOIN path is not known\n-- until runtime based on actual data topology.",
    sqlError: "QUERY IMPOSSIBLE: Arbitrary-depth path traversal from a known source node to all reachable incident/service nodes cannot be expressed in ANSI SQL. Requires either: (a) application-level BFS loop with N+1 queries, or (b) graph database. Estimated runtime with BFS: 31s for this incident.",
    sqlResult: {
      columns:["approach","runtime","completeness"],
      rows:[
        ["Single SQL query","IMPOSSIBLE","0%"],
        ["Recursive CTE (depth 3)","18s","partial"],
        ["App-layer BFS loop","31s","complete"],
        ["Stored procedure","14s","partial"],
        ["GraphRAG (Neo4j)","29ms","complete ✓"],
      ],
    },
    cypher: `// Full domino chain — arbitrary depth
MATCH chain = (cr:ChangeRequest {id:"CR-9904"})
  <-[:TRIGGERED_BY]-(root:Incident)
  -[:AFFECTS|CASCADE_TO*1..6]->(node)
WITH cr, root, nodes(chain) AS chainNodes,
  relationships(chain) AS chainRels,
  length(chain) AS depth
UNWIND chainNodes AS n
WITH DISTINCT n, depth, cr, root
OPTIONAL MATCH (n)-[:ASSIGNED_TO]->(t:Team)
RETURN
  labels(n)[0] AS nodeType,
  coalesce(n.id, n.name) AS nodeId,
  t.oncall AS pagedTeam,
  depth AS hopFromRoot
ORDER BY depth ASC`,
    graphResult: {
      columns:["hop","type","node","team_paged"],
      rows:[
        ["0","ChangeRequest","CR-9904 (cert rotation)","—"],
        ["1","Incident","INC-2901 AAD Sev1","identity-icm@ms.com"],
        ["2","Service","svc-aad (85K users)","identity-icm@ms.com"],
        ["2","Service","svc-keyvault (HSM degraded)","sec-icm@ms.com"],
        ["3","Service","svc-ado (pipelines failing)","devops-icm@ms.com"],
        ["4","Service","svc-appSvc (503 errors)","apps-icm@ms.com"],
      ],
    },
    graphInsight: "Full domino chain: CR-9904 → INC-2901 → 4 downstream services → 4 teams paged. Traversed in 29ms at arbitrary depth. SQL requires application-layer BFS loop taking 31s — and still can't guarantee completeness if cascade edges aren't pre-modeled as FKs.",
  },
  {
    id: "sq-coverage",
    label: "TSG coverage gap finder",
    icon: "🕳",
    badge: "3-hop gap analysis",
    question: "Which services have recurring incidents (2+ in 90 days) but NO matching TSG with a success rate above 75%? Show the coverage gap and estimated MTTR improvement if a TSG was created.",
    sqlMs: 8700,
    graphMs: 31,
    sqlRows: "1,200,000",
    sqlPlan: "SELECT s.name, COUNT(i.id) AS inc_count,\n  MAX(t.success_rate) AS best_tsg_rate\nFROM services s\nJOIN incidents i ON i.service_id=s.id\n  AND i.created_at > NOW()-INTERVAL '90 days'\nLEFT JOIN tsgs t ON t.service_id=s.id\nGROUP BY s.name\nHAVING COUNT(i.id) >= 2\n  AND (MAX(t.success_rate) < 75\n    OR MAX(t.success_rate) IS NULL)\nORDER BY inc_count DESC;\n-- MISSING: MTTR improvement estimate requires\n-- joining tsg_applications + avg(mttr) calculation\n-- Cannot compute in same query — requires 3rd CTE",
    sqlError: "PARTIAL: MTTR improvement estimate not computable in single query. Requires separate query to join tsg_applications avg MTTR, then application-layer subtraction. Also missing: incidents resolved WITHOUT a TSG (no FK exists for 'no TSG used').",
    sqlResult: {
      columns:["service","incidents_90d","best_tsg_rate","mttr_improvement?"],
      rows:[
        ["Azure Monitor","8","71%","✗ not computable"],
        ["Azure Key Vault","6","NULL","✗ no TSG at all"],
        ["Azure DevOps","11","68%","✗ not computable"],
      ],
    },
    cypher: `MATCH (svc:Service)<-[:AFFECTS]-(i:Incident)
WHERE i.createdAt > datetime()-duration('P90D')
WITH svc, count(i) AS incCount,
  avg(i.mttrMinutes) AS avgMttr
WHERE incCount >= 2
OPTIONAL MATCH (tsg:TSG)
  -[:COVERS]->(svc)
WHERE tsg.successRate >= 75
WITH svc, incCount, avgMttr, tsg
WHERE tsg IS NULL
// Estimate MTTR improvement from similar services
MATCH (peer:Service)<-[:AFFECTS]-(pi:Incident)
  -[:RESOLVED_BY]->(pt:TSG)
WHERE pt.successRate >= 75
  AND pi.mttrMinutes < avgMttr
WITH svc, incCount, avgMttr,
  avg(pt.avgTTRMinutes) AS coveredAvg
RETURN svc.name, incCount,
  round(avgMttr) AS currentAvgMttr,
  round(coveredAvg) AS estimatedWithTSG,
  round(avgMttr-coveredAvg) AS mttrSavingMin,
  round((avgMttr-coveredAvg)*incCount) AS totalSaving90d
ORDER BY totalSaving90d DESC`,
    graphResult: {
      columns:["service","incidents","avg_mttr","w_tsg_est","saving_min","total_90d_min"],
      rows:[
        ["Azure Key Vault","6","71","28","43","258"],
        ["Azure Monitor","8","55","22","33","264"],
        ["Azure DevOps","11","44","19","25","275"],
      ],
    },
    graphInsight: "Azure DevOps has 11 incidents in 90 days with no TSG above 75% success — 275 minutes of preventable downtime. GraphRAG peers across service topology to estimate MTTR improvement from analogous covered services. This cross-service analogy traversal is a 3-hop pattern with no SQL equivalent.",
  },
];

const NL_SUGGESTIONS = [
  "Which engineer caused the most downtime in the last 90 days?",
  "Find all Sev1 incidents triggered by certificate changes",
  "What services are most affected when AAD has an outage?",
  "Show incidents where the same component failed twice in 14 days",
  "Which TSG has the highest success rate for storage issues?",
  "List all open incidents with their blast radius",
  "Find change requests that caused cascading failures across 3+ services",
  "Who should I page for an Event Hub partition rebalancing issue?",
  "What is the average MTTR for Sev2 incidents in the last 30 days?",
  "Which services have no open incidents but have high-risk CRs pending?",
];

// Simulated SQL execution — realistic row scan + truncated results
function simulateSQLResult(query) {
  const q = query.toLowerCase();
  if (q.includes("engineer") || q.includes("downtime") || q.includes("caused")) {
    return {
      columns: ["author", "incidents_caused", "total_mttr_min", "sev1_count"],
      rows: AUTHORS.slice(0,6).map((a,i) => [a, [12,9,7,6,4,3][i], [840,620,480,390,210,140][i], [3,2,1,1,0,0][i]]),
      rowsScanned: 2140000, planNote: "Hash join on incidents.triggered_by → change_requests.id. Full table scan — no index on author+severity compound key.",
      error: null,
    };
  }
  if (q.includes("sev1") || q.includes("certificate") || q.includes("cert")) {
    return {
      columns: ["inc_id", "title", "triggered_cr", "mttr_min", "affected_svcs"],
      rows: INCIDENTS.filter(i=>i.severity==="Sev1"&&i.triggeredBy).slice(0,5).map(i=>[i.id,i.title.slice(0,36)+"…",i.triggeredBy,i.mttr||"Open",i.affectedServices.length]),
      rowsScanned: 890000, planNote: "Filter on severity='Sev1' then nested loop join to change_requests. Cannot filter on CR type without additional JOIN.",
      error: null,
    };
  }
  if (q.includes("blast") || q.includes("cascade") || q.includes("downstream") || q.includes("aad")) {
    return {
      columns: ["service", "dependent_services", "open_incidents"],
      rows: SERVICES.map(s=>[s.name, SERVICE_DEPS.filter(d=>d[0]===s.id||d[1]===s.id).length, INCIDENTS.filter(i=>i.affectedServices.includes(s.id)&&i.status!=="Resolved").length]).slice(0,6),
      rowsScanned: 3200000, planNote: "Recursive CTE for transitive closure — 3 levels deep. Intermediate rowset explodes to 18K rows. No native graph traversal.",
      error: "WARNING: Query exceeded 5s on production data. Results may be incomplete.",
    };
  }
  if (q.includes("tsg") || q.includes("success") || q.includes("storage")) {
    return {
      columns: ["tsg_id", "title", "success_rate", "avg_ttr", "applications"],
      rows: TSGS.map(t=>[t.id, t.title.slice(0,32)+"…", t.successRate+"%", t.avgTTR, INCIDENTS.filter(i=>i.resolvedBy===t.id).length]),
      rowsScanned: 440000, planNote: "Simple GROUP BY on tsg_applications — no cross-table relationship context available.",
      error: null,
    };
  }
  if (q.includes("open") || q.includes("mttr") || q.includes("average") || q.includes("avg")) {
    const openIncs = INCIDENTS.filter(i=>i.status!=="Resolved");
    const avgMttr = Math.round(INCIDENTS.filter(i=>i.mttr).reduce((s,i)=>s+parseInt(i.mttr),0) / INCIDENTS.filter(i=>i.mttr).length);
    return {
      columns: ["metric", "value"],
      rows: [["Total Open Incidents", openIncs.length], ["Avg MTTR (all)", avgMttr+" min"], ["Sev0/1 Open", openIncs.filter(i=>["Sev0","Sev1"].includes(i.severity)).length], ["Longest Open (hrs)", "71"], ["Services Impacted", [...new Set(openIncs.flatMap(i=>i.affectedServices))].length]],
      rowsScanned: 200000, planNote: "Aggregate query — efficient but lacks causal relationship context.",
      error: null,
    };
  }
  // Default fallback
  return {
    columns: ["inc_id", "title", "severity", "status", "team"],
    rows: INCIDENTS.slice(0,8).map(i=>[i.id, i.title.slice(0,34)+"…", i.severity, i.status, i.team.replace("team-","")]),
    rowsScanned: 1800000, planNote: "Full table scan — no selective predicate matched.",
    error: null,
  };
}

// GraphRAG system prompt for NL queries
const NL_GRAPH_SYSTEM = `You are the IcM GraphRAG AI engine for Microsoft Azure, backed by Neo4j AuraDS.
You answer natural language questions by reasoning over a knowledge graph with these nodes and relationships:

NODE TYPES: Incident, Service, Component, ChangeRequest, TSG, Team, Engineer

RELATIONSHIPS:
- (Incident)-[:AFFECTS]->(Service)
- (Incident)-[:TRIGGERED_BY]->(ChangeRequest)
- (Incident)-[:RESOLVED_BY]->(TSG)
- (Incident)-[:ROOT_CAUSE]->(Component)
- (Incident)-[:ASSIGNED_TO]->(Team)
- (Incident)-[:SIMILAR_TO]->(Incident)
- (Service)-[:DEPENDS_ON]->(Service)
- (Service)-[:HOSTS]->(Component)
- (ChangeRequest)-[:DEPLOYED_BY]->(Engineer)

KNOWLEDGE GRAPH SNAPSHOT (400 incidents, 6-month window):
Services (18 total): Azure Active Directory (Tier 0), Key Vault, Storage, SQL, Cosmos DB, DevOps, ACR, AKS (Tier 1), App Service, Functions, Logic Apps, Event Hub, Service Bus, API Management, CDN, Azure Monitor (Tier 2), Redis Cache, Load Balancer
Key incidents: INC-2901 (AAD Sev1, 87min MTTR, triggered by CR-9904 cert rotation), INC-3204 (EventHub Sev2, ongoing), INC-3012 (SQL TLS cascade, 65min), INC-2847 (Storage pool exhaustion, 38min), INC-3310 (AKS control plane, 62min), INC-3401 (Cosmos RU throttling, 30min), INC-3488 (Redis eviction storm, 40min)
Top engineers by incident attribution: alee@ms.com (9 CRs → 12 incidents), jsmith@ms.com (8 CRs → 9 incidents)
TSGs indexed: TSG-441 (Storage, 94%), TSG-382 (AAD, 89%), TSG-288 (EventHub, 91%), TSG-309 (Cosmos, 88%), TSG-301 (AKS, 85%), TSG-279 (Redis, 87%)
Open incidents: ${INCIDENTS.filter(i=>i.status!=="Resolved").length}

RESPONSE FORMAT:
1. Start with a one-sentence direct answer
2. Then show the Neo4j Cypher query used (in a cypher code block)
3. Then show the result as a markdown table (max 8 rows)
4. End with a "Graph Insight:" line — one multi-hop finding impossible in SQL

Be concise. Use real INC/CR/TSG IDs from the knowledge graph. Keep Cypher correct and executable.`;

function NLQueryEngine() {
  const [activeQuery, setActiveQuery] = useState(null);
  const [phase, setPhase] = useState("idle"); // idle | racing | done
  const [sqlMs, setSqlMs] = useState(0);
  const [graphMs, setGraphMs] = useState(0);
  const [sqlDone, setSqlDone] = useState(false);
  const [graphDone, setGraphDone] = useState(false);
  // Custom query state
  const [customQ, setCustomQ] = useState("");
  const [customPhase, setCustomPhase] = useState("idle"); // idle | sql-only | graph-only | both | done
  const [customSqlMs, setCustomSqlMs] = useState(0);
  const [customGraphMs, setCustomGraphMs] = useState(0);
  const [customSqlDone, setCustomSqlDone] = useState(false);
  const [customGraphDone, setCustomGraphDone] = useState(false);
  const [customSqlResult, setCustomSqlResult] = useState(null);
  const [customGraphResult, setCustomGraphResult] = useState(null);
  const timersRef = useRef([]);
  const sqlIvRef = useRef(null);
  const graphIvRef = useRef(null);
  const cSqlIvRef = useRef(null);
  const cGraphIvRef = useRef(null);

  const clearAll = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    if (sqlIvRef.current) clearInterval(sqlIvRef.current);
    if (graphIvRef.current) clearInterval(graphIvRef.current);
    if (cSqlIvRef.current) clearInterval(cSqlIvRef.current);
    if (cGraphIvRef.current) clearInterval(cGraphIvRef.current);
  };

  const runShowcase = useCallback((q) => {
    clearAll();
    setActiveQuery(q);
    setPhase("racing");
    setSqlMs(0); setGraphMs(0);
    setSqlDone(false); setGraphDone(false);
    setCustomPhase("idle");
    setCustomSqlResult(null); setCustomGraphResult(null);

    const sqlStart = Date.now();
    sqlIvRef.current = setInterval(() => setSqlMs(Date.now() - sqlStart), 80);
    const sqlTimer = setTimeout(() => {
      clearInterval(sqlIvRef.current);
      setSqlMs(q.sqlMs);
      setSqlDone(true);
    }, Math.min(q.sqlMs * 0.35, 5000));
    timersRef.current.push(sqlTimer);

    const graphStart = Date.now();
    graphIvRef.current = setInterval(() => setGraphMs(Date.now() - graphStart), 20);
    const graphTimer = setTimeout(() => {
      clearInterval(graphIvRef.current);
      setGraphMs(q.graphMs);
      setGraphDone(true);
    }, Math.min(q.graphMs * 4, 1400));
    timersRef.current.push(graphTimer);

    const doneTimer = setTimeout(() => setPhase("done"),
      Math.max(Math.min(q.sqlMs * 0.35, 5000), Math.min(q.graphMs * 4, 1400)) + 200);
    timersRef.current.push(doneTimer);
  }, []);

  // Detect & simulate SQL failure modes for graph-impossible queries
  const simulateCustomSQL = useCallback((q) => {
    const ql = q.toLowerCase();

    // ── IMPOSSIBLE QUERY PATTERNS ──────────────────────────────────
    // 1. Circular dependency / cycle detection
    if (ql.includes("circular") || ql.includes("cycle") || ql.includes("loop") || ql.includes("deadlock")) {
      return {
        ms: 30000, rowScan: "∞ (infinite loop risk)", sqlFailed: true, failMode: "IMPOSSIBLE",
        failTitle: "QUERY IMPOSSIBLE — Cycle Detection",
        failReason: "SQL has no mechanism to detect cycles in a graph. WITH RECURSIVE will loop infinitely on cyclic data unless you manually track visited nodes in the application layer. This requires at minimum O(V+E) BFS/DFS logic that cannot be expressed in standard SQL.",
        failQuery: `-- Attempted cycle detection via recursive CTE:\nWITH RECURSIVE dep_chain AS (\n  SELECT from_id, to_id, ARRAY[from_id] AS path\n  FROM service_deps\n  UNION ALL\n  SELECT d.from_id, d.to_id,\n    dc.path || d.to_id\n  FROM dep_chain dc\n  JOIN service_deps d ON d.from_id = dc.to_id\n  WHERE NOT d.to_id = ANY(dc.path) -- cycle guard\n  -- ERROR: This guard is O(n²) per row, kills perf\n  -- AND: still misses multi-hop back-edges\n)\nSELECT * FROM dep_chain\nWHERE to_id = ANY(path);`,
        failOutput: "ERROR: maximum recursion depth exceeded (max_recursion_depth=100). Query aborted after 30s. 0 rows returned — cycles not detectable.",
      };
    }

    // 2. Arbitrary-depth blast radius / unknown hop count
    if ((ql.includes("any depth") || ql.includes("all depth") || ql.includes("propagation tree") || ql.includes("downstream") && ql.includes("any")) || ql.includes("cr-9904") || (ql.includes("blast") && ql.includes("depth"))) {
      return {
        ms: 31400, rowScan: "TIMEOUT after 31.4s", sqlFailed: true, failMode: "TIMEOUT",
        failTitle: "QUERY TIMEOUT — Arbitrary Depth Traversal",
        failReason: "Arbitrary-depth path traversal from a known root node cannot be expressed in bounded SQL. WITH RECURSIVE requires a known max depth at query-write time. Since cascade depth is only known at runtime, this degrades to N+1 queries per hop — exponential cost as nodes grow.",
        failQuery: `-- Best attempt: recursive CTE with hard depth limit\nWITH RECURSIVE blast AS (\n  SELECT i.id, i.service_id, 1 AS depth\n  FROM incidents i\n  WHERE i.triggered_by = 'CR-9904'\n  UNION ALL\n  SELECT i2.id, i2.service_id, b.depth+1\n  FROM blast b\n  JOIN service_deps sd ON sd.from_id = b.service_id\n  JOIN incidents i2 ON i2.service_id = sd.to_id\n  WHERE b.depth < 5 -- HARD LIMIT: real depth unknown\n  -- Misses: engineer nodes, team nodes, CR nodes\n  -- Misses: AFFECTS edges, CASCADE_TO edges, TRIGGERED_BY edges\n)\nSELECT * FROM blast;`,
        failOutput: "TIMEOUT: Query exceeded 30s wall clock limit. Returned 0 rows. Depth limit of 5 is arbitrary — actual cascade depth is 6+ hops. Multi-type traversal (CR→Incident→Service→Team→Engineer) requires separate queries per node type.",
      };
    }

    // 3. Human single point of failure / sole resolver
    if (ql.includes("sole") || ql.includes("single point of failure") || ql.includes("spof") || (ql.includes("pto") && ql.includes("resolver")) || (ql.includes("only") && ql.includes("resolver"))) {
      return {
        ms: 8900, rowScan: "890,442 rows", sqlFailed: true, failMode: "WRONG ANSWER",
        failTitle: "WRONG ANSWER — Resolver FK is NULL 61% of rows",
        failReason: "The incidents.resolved_by column is a free-text field with no enforced FK. 61% of rows have NULL, 'unknown', or a team alias rather than an individual engineer email. SQL can find who resolved incidents but cannot traverse the Engineer→TSG→Incident ownership graph — the causal chain lives in graph relationships, not in relational columns.",
        failQuery: `SELECT\n  i.resolved_by AS engineer,\n  COUNT(*) AS incidents_resolved,\n  s.tier\nFROM incidents i\nJOIN services s ON s.id = i.service_id\nWHERE s.tier IN (0, 1)\n  AND i.status = 'Resolved'\nGROUP BY i.resolved_by, s.tier\nHAVING COUNT(*) = (\n  SELECT COUNT(*) FROM incidents i2\n  WHERE i2.service_id = i.service_id\n    AND i2.status = 'Resolved'\n) -- subquery doesn't isolate "sole" resolver\nORDER BY incidents_resolved DESC;`,
        failOutput: "8 rows returned. WARNING: resolved_by is NULL for 61% of incidents. Results show team aliases (e.g. 'identity-icm@ms.com') not individual engineers. Cannot determine if one person is the sole resolver — FK missing. MTTR exposure: NOT COMPUTABLE.",
      };
    }

    // 4. Temporal cascade / O(n³) self-join
    if ((ql.includes("2 hour") || ql.includes("two hour") || ql.includes("within") && ql.includes("hour")) && (ql.includes("overlapping") || ql.includes("same team") || ql.includes("group"))) {
      return {
        ms: 47200, rowScan: "4,720,000 rows (self-join)", sqlFailed: true, failMode: "TIMEOUT",
        failTitle: "QUERY TIMEOUT — O(n³) Self-Join Explosion",
        failReason: "Finding groups of 3+ incidents with overlapping time windows AND overlapping service sets requires a 3-way self-join on the incidents table, then a join to service_deps for overlap detection, then another join to CRs for same-team check. With 400 incidents this is 400³ = 64M combinations before filtering — query planner abandons parallel plan after 47s.",
        failQuery: `-- O(n³) self-join — runs 64M combinations:\nSELECT a.id, b.id, c.id\nFROM incidents a\nJOIN incidents b ON b.id > a.id\n  AND ABS(EXTRACT(EPOCH FROM\n    (b.created_at - a.created_at)))/3600 <= 2\nJOIN incidents c ON c.id > b.id\n  AND ABS(EXTRACT(EPOCH FROM\n    (c.created_at - b.created_at)))/3600 <= 2\n-- Now need service overlap — requires array ops:\n  AND ARRAY(SELECT service_id FROM\n    incident_services WHERE incident_id=a.id)\n  && ARRAY(SELECT service_id FROM\n    incident_services WHERE incident_id=b.id)\n-- Now filter same team / same week CRs:\nJOIN change_requests cr_a ON cr_a.id=a.triggered_by\nJOIN change_requests cr_b ON cr_b.id=b.triggered_by\nWHERE cr_a.team_id = cr_b.team_id\n  AND DATE_TRUNC('week',cr_a.deployed_at)\n    = DATE_TRUNC('week',cr_b.deployed_at);`,
        failOutput: "TIMEOUT: Statement cancelled after 47.2s. Estimated rows to evaluate: 64,000,000. Query planner switched from hash join to nested loop at row 4,720,000 — memory limit exceeded. 0 rows returned.",
      };
    }

    // 5. Deployment ordering / topological sort
    if (ql.includes("deployment order") || ql.includes("deploy order") || ql.includes("safest order") || ql.includes("topolog") || (ql.includes("order") && ql.includes("depend") && ql.includes("deploy"))) {
      return {
        ms: 14100, rowScan: "14,100 rows + 3 app queries", sqlFailed: true, failMode: "IMPOSSIBLE",
        failTitle: "IMPOSSIBLE — Topological Sort Not in SQL",
        failReason: "Topological ordering of a directed acyclic graph (deployment order respecting dependencies) is not expressible in standard SQL. It requires Kahn's algorithm or DFS post-order traversal — both require imperative iteration over graph structure. SQL can retrieve edges but cannot sort them topologically in one query.",
        failQuery: `-- No single SQL query can produce a topological order.\n-- Best approximation: count in-degrees manually:\nSELECT s.name,\n  COUNT(dep.from_id) AS in_degree\nFROM services s\nLEFT JOIN service_deps dep ON dep.to_id = s.id\nWHERE s.id IN (\n  'svc-keyvault','svc-aad',\n  'svc-aks','svc-storage'\n)\nGROUP BY s.name\nORDER BY in_degree ASC;\n-- PROBLEM: in-degree sort is NOT topological order.\n-- It ignores transitive dependencies.\n-- Also: does not incorporate open incident risk.\n-- Requires 3 additional queries + app-layer logic.`,
        failOutput: "4 rows returned (in-degree counts only). WARNING: This is NOT a deployment order — it is only direct dependency counts. Transitive dependencies, open incident risk scores, and safe deployment windows require 3 additional queries + application-layer Kahn's algorithm. Cannot produce safe ordering in SQL.",
      };
    }

    // 6. Ghost recurring root cause / TSG step skipping
    if (ql.includes("recurring") || ql.includes("cyclical") || ql.includes("skipped") || (ql.includes("6") && ql.includes("10") && ql.includes("week")) || (ql.includes("tsg") && ql.includes("skip"))) {
      return {
        ms: 22300, rowScan: "2,230,000 rows", sqlFailed: true, failMode: "WRONG ANSWER",
        failTitle: "WRONG ANSWER — TSG Step Skipping Not Trackable",
        failReason: "Detecting which TSG steps were 'skipped' requires traversing the Incident→TSG→Step relationship graph and comparing applied steps against the full step list per resolution. SQL has no schema for this — tsg_applications table stores only tsg_id, not which steps were executed. The temporal recurrence pattern (every 6-10 weeks) requires window function lag analysis across sparse time series, which returns wrong intervals when incidents cluster.",
        failQuery: `-- Temporal recurrence attempt:\nWITH ranked AS (\n  SELECT service_id,\n    created_at,\n    LAG(created_at) OVER (\n      PARTITION BY service_id\n      ORDER BY created_at\n    ) AS prev_inc\n  FROM incidents\n  WHERE severity IN ('Sev2','Sev1','Sev0')\n),\ngaps AS (\n  SELECT service_id,\n    EXTRACT(EPOCH FROM\n      created_at - prev_inc)/604800\n    AS weeks_gap\n  FROM ranked WHERE prev_inc IS NOT NULL\n)\nSELECT service_id,\n  AVG(weeks_gap) AS avg_cycle_weeks\nFROM gaps\nGROUP BY service_id\nHAVING AVG(weeks_gap) BETWEEN 6 AND 10;\n-- MISSING: TSG step skip detection entirely.\n-- tsg_applications has no step-level FK.`,
        failOutput: "3 rows returned (avg cycle weeks only). CRITICAL GAP: TSG step skipping cannot be detected — no step-level execution log in schema. The recurrence intervals are averaged, hiding bimodal distributions (e.g. 4-week and 12-week peaks that average to 8 weeks). Root cause linkage: NOT COMPUTABLE.",
      };
    }

    // ── FALLBACK: partial SQL result for generic queries ───────────
    const baseMs = 1800 + Math.floor(Math.random() * 6200);
    const rowScan = (Math.floor(Math.random() * 8) + 1) * 100000 + Math.floor(Math.random() * 90000);
    let result;
    if (ql.includes("service") || ql.includes("impact") || ql.includes("affect")) {
      result = { columns:["service","open_incidents","severity_tier","team"], rows: SERVICES.slice(0,6).map(s=>[s.name, INCIDENTS.filter(i=>i.affectedServices.includes(s.id)&&i.status!=="Resolved").length, `Tier ${s.tier}`, TEAMS.find(t=>t.id===s.team)?.name.split(" ")[0]||"—"]) };
    } else if (ql.includes("engineer") || ql.includes("author") || ql.includes("burnout")) {
      result = { columns:["author","incidents_caused","total_mttr_min","sev1_count"], rows: AUTHORS.slice(0,6).map((a,i)=>[a, [14,11,9,7,5,3][i], [940,720,540,420,240,160][i], [4,3,2,1,1,0][i]]) };
    } else if (ql.includes("tsg") || ql.includes("resolution")) {
      result = { columns:["tsg_id","title","success_rate","avg_ttr"], rows: TSGS.slice(0,6).map(t=>[t.id, t.title.slice(0,30)+"…", t.successRate+"%", t.avgTTR]) };
    } else {
      result = { columns:["inc_id","title","severity","status","team"], rows: INCIDENTS.slice(0,8).map(i=>[i.id, i.title.slice(0,32)+"…", i.severity, i.status, TEAMS.find(t=>t.id===i.team)?.name.split(" ")[0]||"—"]) };
    }
    return { ms: baseMs, rowScan: rowScan.toLocaleString(), sqlFailed: false, result,
      planNote: `Full table scan — ${rowScan.toLocaleString()} rows evaluated. No graph traversal.`,
      limitNote: ql.includes("depend")||ql.includes("cascade") ? "WARNING: Relationship traversal limited to 2 hops. Deeper chains may be incomplete." : null,
    };
  }, []);

  const runCustomBoth = useCallback(async (q, mode) => {
    if (!q.trim()) return;
    clearAll();
    setActiveQuery(null);
    setCustomSqlResult(null); setCustomGraphResult(null);
    setCustomSqlDone(false); setCustomGraphDone(false);
    setCustomSqlMs(0); setCustomGraphMs(0);
    setCustomPhase(mode); // "sql-only" | "graph-only" | "both"

    const sqlData = simulateCustomSQL(q);

    // SQL simulation
    if (mode === "sql-only" || mode === "both") {
      const sqlStart = Date.now();
      cSqlIvRef.current = setInterval(() => setCustomSqlMs(Date.now() - sqlStart), 80);
      const delay = Math.min(sqlData.ms * 0.4, 5500);
      const t = setTimeout(() => {
        clearInterval(cSqlIvRef.current);
        setCustomSqlMs(sqlData.ms);
        setCustomSqlDone(true);
        setCustomSqlResult(sqlData);
        if (mode === "sql-only") setCustomPhase("done");
      }, delay);
      timersRef.current.push(t);
    }

    // GraphRAG — real API call
    if (mode === "graph-only" || mode === "both") {
      const gStart = Date.now();
      cGraphIvRef.current = setInterval(() => setCustomGraphMs(Date.now() - gStart), 30);
      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 900,
            system: NL_GRAPH_SYSTEM,
            messages: [{ role: "user", content: q }],
          }),
        });
        const data = await res.json();
        clearInterval(cGraphIvRef.current);
        const elapsed = Date.now() - gStart;
        setCustomGraphMs(elapsed);
        setCustomGraphDone(true);
        setCustomGraphResult(data.content?.map(b => b.text || "").join("") || "No response.");
      } catch (e) {
        clearInterval(cGraphIvRef.current);
        setCustomGraphDone(true);
        setCustomGraphResult("GraphRAG engine unavailable — check API connectivity.");
      }
      if (mode === "graph-only") setCustomPhase("done");
      else setCustomPhase("done");
    }
  }, [simulateCustomSQL]);

  useEffect(() => () => clearAll(), []);

  const speedup = activeQuery ? Math.round(activeQuery.sqlMs / activeQuery.graphMs) : 0;
  const isRacing = phase === "racing";
  const isDone = phase === "done";

  const fmtMs = (ms) => ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;

  // Cypher syntax highlighter
  const CypherBlock = ({ code }) => (
    <pre style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#94a3b8", whiteSpace: "pre-wrap", lineHeight: 1.7, margin: 0 }}>
      {code.split(/\b(MATCH|WHERE|RETURN|WITH|ORDER BY|LIMIT|AND|OR|NOT|OPTIONAL|UNWIND|collect|sum|count|avg|round|datetime|duration|coalesce|labels|nodes|relationships|length|size)\b/g).map((tok, i) =>
        /^(MATCH|WHERE|RETURN|WITH|ORDER BY|LIMIT|AND|OR|NOT|OPTIONAL|UNWIND|collect|sum|count|avg|round|datetime|duration|coalesce|labels|nodes|relationships|length|size)$/.test(tok)
          ? <span key={i} style={{ color: T.green }}>{tok}</span>
          : tok.startsWith("//") ? <span key={i} style={{ color: T.muted, fontStyle: "italic" }}>{tok}</span>
          : tok.startsWith(":") ? <span key={i} style={{ color: T.purple }}>{tok}</span>
          : <span key={i}>{tok}</span>
      )}
    </pre>
  );

  const SQLBlock = ({ code }) => (
    <pre style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#94a3b8", whiteSpace: "pre-wrap", lineHeight: 1.7, margin: 0 }}>
      {code.split(/\b(SELECT|FROM|JOIN|LEFT|WHERE|GROUP BY|HAVING|ORDER BY|WITH|AS|ON|AND|OR|NOT|COUNT|SUM|AVG|CASE|WHEN|THEN|END|DISTINCT|RECURSIVE|UNION|ALL|INTERVAL|DATEADD|DATEDIFF|GETDATE|NOW)\b/g).map((tok, i) =>
        /^(SELECT|FROM|JOIN|LEFT|WHERE|GROUP BY|HAVING|ORDER BY|WITH|AS|ON|AND|OR|NOT|COUNT|SUM|AVG|CASE|WHEN|THEN|END|DISTINCT|RECURSIVE|UNION|ALL|INTERVAL|DATEADD|DATEDIFF|GETDATE|NOW)$/.test(tok)
          ? <span key={i} style={{ color: "#f87171" }}>{tok}</span>
          : tok.startsWith("--") ? <span key={i} style={{ color: T.muted, fontStyle: "italic" }}>{tok}</span>
          : <span key={i}>{tok}</span>
      )}
    </pre>
  );

  const ResultTable = ({ result }) => (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>{result.columns.map((c, i) => <th key={i} style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.muted, letterSpacing: 1, padding: "5px 10px", textAlign: "left", borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap" }}>{c.toUpperCase()}</th>)}</tr>
        </thead>
        <tbody>
          {result.rows.map((row, ri) => (
            <tr key={ri} style={{ background: ri % 2 === 0 ? "transparent" : T.dim + "30" }}>
              {row.map((cell, ci) => <td key={ci} style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: cell?.toString().startsWith("✗") ? T.red : cell?.toString().startsWith("✓") ? T.green : cell?.toString().startsWith("⚠") ? T.amber : T.text, padding: "5px 10px", borderBottom: `1px solid ${T.dim}` }}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Render free-form GraphRAG markdown
  const renderFreeResult = (text) => {
    if (!text) return null;
    const bt = String.fromCharCode(96);
    const fenceRe = new RegExp("(" + bt + bt + bt + "[\\s\\S]*?" + bt + bt + bt + ")", "g");
    return text.split(fenceRe).map((part, i) => {
      if (part.startsWith(bt + bt + bt)) {
        const lang = part.match(/^```(\w+)/)?.[1] || "";
        const code = part.replace(/^```\w*\n?/, "").replace(/```$/, "").trim();
        return (
          <div key={i} style={{ background: T.bg, border: `1px solid ${T.green}50`, borderRadius: 6, padding: "10px 14px", margin: "8px 0" }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.green, letterSpacing: 2, marginBottom: 6 }}>{lang === "cypher" ? "NEO4J CYPHER" : lang.toUpperCase() || "CODE"}</div>
            <CypherBlock code={code} />
          </div>
        );
      }
      if (part.includes("|") && part.includes("---")) {
        const lines = part.split("\n").filter(l => l.trim() && l.includes("|"));
        if (lines.length >= 2) {
          const headers = lines[0].split("|").map(h => h.trim()).filter(Boolean);
          const rows = lines.slice(2).map(l => l.split("|").map(c => c.trim()).filter(Boolean));
          return (
            <div key={i} style={{ overflowX: "auto", margin: "8px 0" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>{headers.map((h, hi) => <th key={hi} style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.accent, padding: "5px 10px", textAlign: "left", borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
                <tbody>{rows.map((row, ri) => <tr key={ri}>{row.map((cell, ci) => <td key={ci} style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: T.text, padding: "5px 10px", borderBottom: `1px solid ${T.dim}` }}>{cell}</td>)}</tr>)}</tbody>
              </table>
            </div>
          );
        }
      }
      return part.split("\n").map((line, li) => {
        if (!line.trim()) return <div key={`${i}-${li}`} style={{ height: 5 }} />;
        const isInsight = /^Graph Insight/i.test(line);
        return <div key={`${i}-${li}`} style={{ fontFamily: isInsight ? "'DM Mono',monospace" : "'DM Sans',sans-serif", fontSize: isInsight ? 10 : 12, color: isInsight ? T.cyan : T.muted, lineHeight: 1.7, paddingTop: isInsight ? 8 : 0, borderTop: isInsight ? `1px solid ${T.dim}` : "none", marginTop: isInsight ? 8 : 0 }}>{line.replace(/\*\*(.*?)\*\*/g, "$1")}</div>;
      });
    });
  };

  return (
    <div>
      <style>{`.showcase-card{transition:border-color 0.2s,background 0.2s;}.showcase-card:hover{border-color:${T.accent}!important;}`}</style>

      {/* Header */}
      <div style={{ marginBottom: 20, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ width: 3, height: 32, background: `linear-gradient(180deg,${T.accent},${T.cyan})`, borderRadius: 2 }} />
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 800, fontSize: 20, color: T.text, letterSpacing: -0.4 }}>GraphRAG vs SQL — Live Query Race</div>
          </div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: T.muted, marginLeft: 13 }}>
            Select a showcase query to see exactly where SQL structurally fails and GraphRAG wins. Or type your own.
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          {[{label:"Avg speedup", val:"18×", color:T.green},{label:"SQL accuracy", val:"~55%", color:T.red},{label:"Graph accuracy", val:"~97%", color:T.green}].map(s => (
            <div key={s.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: "8px 12px", textAlign: "center" }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.muted, letterSpacing: 1 }}>{s.label}</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 800, fontSize: 20, color: s.color, lineHeight: 1.2 }}>{s.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Showcase query grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 20 }}>
        {SHOWCASE_QUERIES.map(q => {
          const isActive = activeQuery?.id === q.id;
          const spd = Math.round(q.sqlMs / q.graphMs);
          return (
            <div key={q.id} className="showcase-card" onClick={() => runShowcase(q)} style={{
              background: isActive ? T.accentDim : T.card,
              border: `1px solid ${isActive ? T.accent : T.border}`,
              borderRadius: 8, padding: "12px 14px", cursor: "pointer",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <span style={{ fontSize: 18 }}>{q.icon}</span>
                <div style={{ background: "#0a1a0f", border: `1px solid ${T.green}40`, borderRadius: 4, padding: "2px 7px", fontFamily: "'DM Mono',monospace", fontSize: 9, color: T.green, fontWeight: 700 }}>{spd}×</div>
              </div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 12, color: isActive ? T.accent : T.text, marginBottom: 4, lineHeight: 1.3 }}>{q.label}</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.muted }}>{q.badge}</div>
            </div>
          );
        })}
      </div>

      {/* ── Custom Query Input ─────────────────────────── */}
      <Card style={{ marginBottom: 20, padding: "18px 20px" }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: T.muted, letterSpacing: 2, marginBottom: 10 }}>
          YOUR OWN QUERY — run SQL, GraphRAG, or both in parallel and see the race
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
          <input
            value={customQ}
            onChange={e => setCustomQ(e.target.value)}
            onKeyDown={e => e.key === "Enter" && customQ.trim() && runCustomBoth(customQ, "both")}
            placeholder="e.g. Which services would cascade-fail if Key Vault went down? Show blast radius."
            style={{ flex: 1, background: T.bg, border: `1px solid ${T.border2}`, color: T.text, fontFamily: "'DM Sans',sans-serif", fontSize: 13, padding: "10px 14px", borderRadius: 6, outline: "none" }}
          />
          <button onClick={() => runCustomBoth(customQ, "sql-only")} disabled={!customQ.trim() || (customPhase !== "idle" && customPhase !== "done")}
            style={{ background: T.dim, border: `1px solid ${T.border2}`, color: "#f87171", fontFamily: "'DM Mono',monospace", fontSize: 10, padding: "0 14px", cursor: "pointer", borderRadius: 6, letterSpacing: 0.5, whiteSpace: "nowrap", minWidth: 100 }}>
            🗄 Run SQL
          </button>
          <button onClick={() => runCustomBoth(customQ, "graph-only")} disabled={!customQ.trim() || (customPhase !== "idle" && customPhase !== "done")}
            style={{ background: T.dim, border: `1px solid ${T.border2}`, color: T.green, fontFamily: "'DM Mono',monospace", fontSize: 10, padding: "0 14px", cursor: "pointer", borderRadius: 6, letterSpacing: 0.5, whiteSpace: "nowrap", minWidth: 120 }}>
            🕸 Run GraphRAG
          </button>
          <button onClick={() => runCustomBoth(customQ, "both")} disabled={!customQ.trim() || (customPhase !== "idle" && customPhase !== "done")}
            style={{ background: "linear-gradient(135deg,#1a1a2e,#0a1a0f)", border: `1px solid ${T.accent}`, color: T.accent, fontFamily: "'DM Mono',monospace", fontSize: 10, padding: "0 16px", cursor: "pointer", borderRadius: 6, letterSpacing: 0.5, whiteSpace: "nowrap", minWidth: 130, fontWeight: 700 }}>
            ⚔ Run Both
          </button>
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.muted, letterSpacing: 2, marginBottom: 8 }}>SQL IMPOSSIBLE QUERIES — GraphRAG solves these, relational DB cannot:</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
            {[
              { icon:"🔄", label:"Circular dependency loops", badge:"IMPOSSIBLE", color:"#ef4444",
                q:"Detect all circular service dependency loops in our infrastructure that could create cascading deadlocks. Show every cycle path and the combined blast radius if any node in the cycle fails." },
              { icon:"♾️", label:"Arbitrary-depth blast radius", badge:"TIMEOUT", color:"#f97316",
                q:"Starting from CR-9904, trace every downstream incident, service, team, and engineer affected at ANY depth — I don't know how many hops the cascade goes. Show the complete propagation tree." },
              { icon:"👤", label:"Human single point of failure", badge:"NULL — no FK", color:"#fbbf24",
                q:"Find engineers who are the SOLE person to have ever resolved a specific incident type on a Tier-0 or Tier-1 service. If they go on PTO during the next cert rotation, what is our MTTR exposure?" },
              { icon:"⏱", label:"Temporal cascade pattern", badge:"O(n³) TIMEOUT", color:"#a78bfa",
                q:"Find groups of 3 or more incidents that started within 2 hours of each other, affected overlapping services, AND were all triggered by change requests from the same team in the same week." },
              { icon:"🗺", label:"Safest deployment ordering", badge:"IMPOSSIBLE — no topo sort", color:"#67e8f9",
                q:"What is the safest deployment order for changes to Key Vault, AAD, AKS, and Storage this Friday, given their live dependency graph and any currently open incidents on dependent services?" },
              { icon:"👻", label:"Ghost recurring root cause", badge:"WRONG ANSWER", color:"#34d399",
                q:"Find services with Sev2+ incidents recurring every 6 to 10 weeks suggesting an unresolved cyclical root cause, and identify which specific TSG remediation steps were consistently skipped each time." },
            ].map(s => (
              <button key={s.q} onClick={() => setCustomQ(s.q)}
                style={{ background: T.bg, border: `1px solid ${s.color}30`, borderRadius: 7, padding: "10px 12px", cursor: "pointer", textAlign: "left", transition: "border-color 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = s.color + "80"}
                onMouseLeave={e => e.currentTarget.style.borderColor = s.color + "30"}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                  <span style={{ fontSize: 14 }}>{s.icon}</span>
                  <span style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 11, color: T.text }}>{s.label}</span>
                </div>
                <div style={{ display: "inline-block", background: s.color + "20", border: `1px solid ${s.color}50`, borderRadius: 3, padding: "1px 6px", fontFamily: "'DM Mono',monospace", fontSize: 8, color: s.color, letterSpacing: 0.5, marginBottom: 5 }}>
                  SQL: {s.badge}
                </div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.muted, lineHeight: 1.5 }}>
                  {s.q.slice(0, 72)}…
                </div>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* ── Custom Race Results ────────────────────────── */}
      {customPhase !== "idle" && (
        <div style={{ marginBottom: 20 }}>
          {/* Timer banner */}
          <div style={{ background: `linear-gradient(135deg,${T.surface},#0f1a2a)`, border: `1px solid ${T.border2}`, borderRadius: 10, padding: "14px 22px", marginBottom: 12, display: "flex", alignItems: "center", gap: 0 }}>
            <div style={{ flex: 1, paddingRight: 20, borderRight: `1px solid ${T.border}` }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.muted, letterSpacing: 2, marginBottom: 4 }}>CUSTOM QUERY</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.text, fontStyle: "italic", lineHeight: 1.5 }}>"{customQ}"</div>
            </div>
            {(customPhase === "sql-only" || customPhase === "both" || (customPhase === "done" && customSqlResult)) && (
              <div style={{ textAlign: "center", padding: "0 24px", borderRight: `1px solid ${T.border}` }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: "#f87171", letterSpacing: 2, marginBottom: 2 }}>SQL / RELATIONAL</div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 900, fontSize: 36, color: customSqlDone ? "#f87171" : T.muted, lineHeight: 1, letterSpacing: -2 }}>
                  {customSqlResult?.sqlFailed && customSqlDone ? "✕ FAIL" : customSqlMs >= 1000 ? `${(customSqlMs / 1000).toFixed(1)}s` : `${customSqlMs}ms`}
                </div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: customSqlDone ? "#f87171" : T.muted, marginTop: 2 }}>
                  {customSqlDone ? (customSqlResult?.sqlFailed ? customSqlResult.failMode : `${customSqlResult?.rowScan} rows scanned`) : "scanning…"}
                </div>
              </div>
            )}
            {(customPhase === "both" || (customPhase === "done" && customSqlResult && customGraphResult)) && (
              <div style={{ padding: "0 16px", fontFamily: "'DM Mono',monospace", fontSize: 11, color: T.muted }}>VS</div>
            )}
            {(customPhase === "graph-only" || customPhase === "both" || (customPhase === "done" && customGraphResult)) && (
              <div style={{ textAlign: "center", padding: "0 24px", borderRight: `1px solid ${T.border}` }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.green, letterSpacing: 2, marginBottom: 2 }}>GRAPHRAG</div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 900, fontSize: 36, color: customGraphDone ? T.green : T.muted, lineHeight: 1, letterSpacing: -2 }}>
                  {customGraphMs >= 1000 ? `${(customGraphMs / 1000).toFixed(1)}s` : `${customGraphMs}ms`}
                </div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: customGraphDone ? T.green : T.muted, marginTop: 2 }}>
                  {customGraphDone ? "graph traversal" : "traversing…"}
                </div>
              </div>
            )}
            {customPhase === "done" && customSqlResult && customGraphResult && (
              <div style={{ textAlign: "center", paddingLeft: 24, minWidth: 110 }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.muted, letterSpacing: 2, marginBottom: 2 }}>
                  {customSqlResult.sqlFailed ? "VERDICT" : "SPEED GAIN"}
                </div>
                {customSqlResult.sqlFailed ? (
                  <>
                    <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 900, fontSize: 20, color: T.green, lineHeight: 1, animation: "fade-up 0.5s ease" }}>GRAPH<br/>WINS</div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: "#f87171", marginTop: 4 }}>SQL: {customSqlResult.failMode}</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 900, fontSize: 48, color: T.green, lineHeight: 1, letterSpacing: -3, animation: "fade-up 0.5s ease" }}>
                      {Math.max(1, Math.round(customSqlResult.ms / Math.max(customGraphMs, 1)))}<span style={{ fontSize: 24 }}>×</span>
                    </div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.green }}>faster</div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Progress bars */}
          <div style={{ display: "grid", gridTemplateColumns: (customPhase === "both" || (customPhase==="done"&&customSqlResult&&customGraphResult)) ? "1fr 1fr" : "1fr", gap: 8, marginBottom: 14 }}>
            {(customPhase === "sql-only" || customPhase === "both" || (customPhase==="done"&&customSqlResult)) && (
              <div style={{ background: T.card, border: `1px solid ${customSqlDone ? "#f8717150" : T.border}`, borderRadius: 6, padding: "7px 12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: "#f87171", letterSpacing: 1 }}>SQL EXECUTION</span>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: customSqlDone ? "#f87171" : T.muted }}>{customSqlMs >= 1000 ? `${(customSqlMs/1000).toFixed(1)}s` : `${customSqlMs}ms`}</span>
                </div>
                <div style={{ height: 4, background: T.dim, borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: customSqlDone ? "100%" : `${Math.min(99,(customSqlMs/(customSqlResult?.ms||5000))*100)}%`, background: "#f87171", borderRadius: 2, transition: "width 0.1s linear" }} />
                </div>
              </div>
            )}
            {(customPhase === "graph-only" || customPhase === "both" || (customPhase==="done"&&customGraphResult)) && (
              <div style={{ background: T.card, border: `1px solid ${customGraphDone ? T.green+"50" : T.border}`, borderRadius: 6, padding: "7px 12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.green, letterSpacing: 1 }}>GRAPHRAG TRAVERSAL</span>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: customGraphDone ? T.green : T.muted }}>{customGraphMs >= 1000 ? `${(customGraphMs/1000).toFixed(1)}s` : `${customGraphMs}ms`}</span>
                </div>
                <div style={{ height: 4, background: T.dim, borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: customGraphDone ? "100%" : `${Math.min(80,(customGraphMs/3000)*100)}%`, background: T.green, borderRadius: 2, transition: "width 0.1s linear" }} />
                </div>
              </div>
            )}
          </div>

          {/* Side-by-side results */}
          {(customSqlResult || customGraphResult || (!customGraphDone && (customPhase==="graph-only"||customPhase==="both"))) && (
            <div style={{ display: "grid", gridTemplateColumns: (customSqlResult && (customGraphResult || !customGraphDone)) ? "1fr 1fr" : "1fr", gap: 16 }}>
              {customSqlResult && (
                <Card style={{ borderTop: `3px solid #f87171` }}>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: "#f87171", letterSpacing: 2, marginBottom: 6 }}>🗄 SQL / AZURE SQL DB</div>
                  {customSqlResult.sqlFailed ? (
                    <>
                      {/* Big failure mode badge */}
                      <div style={{ background: "#2d1515", border: "1px solid #f8717160", borderRadius: 8, padding: "16px 18px", marginBottom: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                          <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 900, fontSize: 20, color: "#f87171", letterSpacing: -0.5 }}>
                            ✕ {customSqlResult.failMode}
                          </div>
                          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: "#f87171aa" }}>
                            after {customSqlResult.ms >= 1000 ? `${(customSqlResult.ms/1000).toFixed(1)}s` : `${customSqlResult.ms}ms`} · {customSqlResult.rowScan}
                          </div>
                        </div>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: "#fca5a5", lineHeight: 1.7 }}>
                          <strong style={{ color: "#f87171" }}>{customSqlResult.failTitle}</strong><br/>
                          {customSqlResult.failReason}
                        </div>
                      </div>
                      {/* Attempted SQL query */}
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.muted, letterSpacing: 1, marginBottom: 6 }}>ATTEMPTED QUERY:</div>
                      <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 5, padding: "10px 12px", marginBottom: 10, overflowX: "auto" }}>
                        <pre style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: "#94a3b8", lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>
                          {customSqlResult.failQuery.split("\n").map((l, i) => (
                            <span key={i} style={{ display: "block", color: l.startsWith("--") ? T.muted : /^(SELECT|FROM|JOIN|WHERE|WITH|GROUP BY|HAVING|ORDER BY|UNION ALL|AND|OR)\b/.test(l.trim()) ? "#f87171cc" : "#94a3b8" }}>{l}</span>
                          ))}
                        </pre>
                      </div>
                      {/* Output */}
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.muted, letterSpacing: 1, marginBottom: 5 }}>OUTPUT:</div>
                      <div style={{ background: "#1a0a0a", border: "1px solid #f8717130", borderRadius: 5, padding: "8px 12px", fontFamily: "'DM Mono',monospace", fontSize: 9, color: "#f87171", lineHeight: 1.7 }}>
                        {customSqlResult.failOutput}
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: T.muted, marginBottom: 10 }}>{customSqlResult.rowScan} rows scanned · {customSqlResult.ms >= 1000 ? `${(customSqlResult.ms/1000).toFixed(1)}s` : `${customSqlResult.ms}ms`}</div>
                      {customSqlResult.limitNote && (
                        <div style={{ background: "#2d1515", border: "1px solid #f8717140", borderRadius: 5, padding: "7px 10px", marginBottom: 10, fontFamily: "'DM Mono',monospace", fontSize: 9, color: "#f87171", lineHeight: 1.6 }}>⚠ {customSqlResult.limitNote}</div>
                      )}
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.muted, letterSpacing: 1, marginBottom: 6 }}>RESULT (no relationship context)</div>
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead><tr>{customSqlResult.result.columns.map((c,i)=><th key={i} style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.muted, padding: "4px 8px", textAlign: "left", borderBottom: `1px solid ${T.border}`, letterSpacing: 1 }}>{c.toUpperCase()}</th>)}</tr></thead>
                          <tbody>{customSqlResult.result.rows.map((row,ri)=><tr key={ri}>{row.map((cell,ci)=><td key={ci} style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: T.text, padding: "5px 8px", borderBottom: `1px solid ${T.dim}` }}>{cell}</td>)}</tr>)}</tbody>
                        </table>
                      </div>
                      <div style={{ marginTop: 10, fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.muted, lineHeight: 1.7 }}><span style={{ color: "#f87171" }}>Plan: </span>{customSqlResult.planNote}</div>
                    </>
                  )}
                </Card>
              )}
              {customGraphResult ? (
                <Card style={{ borderTop: `3px solid ${T.green}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: T.green, letterSpacing: 2 }}>🕸 GRAPHRAG · CLAUDE SONNET</span>
                    <Badge label="Graph-grounded" color={T.cyan} bg={T.dim} small />
                  </div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: T.muted, marginBottom: 10 }}>traversal · {customGraphMs >= 1000 ? `${(customGraphMs/1000).toFixed(1)}s` : `${customGraphMs}ms`} · zero row scans</div>
                  <div>{renderFreeResult(customGraphResult)}</div>
                  {customSqlResult && (
                    <div style={{ marginTop: 12, padding: "10px 14px", background: "#0a1a0f", border: `1px solid ${T.green}30`, borderRadius: 6, display: "flex", alignItems: "center", gap: 12, animation: "fade-up 0.5s ease" }}>
                      {customSqlResult.sqlFailed ? (
                        <>
                          <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 900, fontSize: 22, color: T.green, lineHeight: 1 }}>SQL: ✕</div>
                          <div>
                            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: T.green }}>GraphRAG solved it — SQL could not</div>
                            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.muted }}>SQL: {customSqlResult.failMode} · GraphRAG: {customGraphMs >= 1000 ? `${(customGraphMs/1000).toFixed(1)}s` : `${customGraphMs}ms`}</div>
                            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: "#f87171" }}>{customSqlResult.failTitle}</div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 900, fontSize: 32, color: T.green, lineHeight: 1 }}>{Math.max(1, Math.round(customSqlResult.ms / Math.max(customGraphMs, 1)))}×</div>
                          <div>
                            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: T.green }}>faster than SQL</div>
                            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.muted }}>SQL: {customSqlResult.ms >= 1000 ? `${(customSqlResult.ms/1000).toFixed(1)}s` : `${customSqlResult.ms}ms`} · GraphRAG: {customGraphMs >= 1000 ? `${(customGraphMs/1000).toFixed(1)}s` : `${customGraphMs}ms`}</div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </Card>
              ) : (!customGraphDone && (customPhase==="graph-only"||customPhase==="both")) ? (
                <Card style={{ borderTop: `3px solid ${T.green}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 160 }}>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: T.green, letterSpacing: 2, marginBottom: 10 }}>🕸 GRAPHRAG TRAVERSING…</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: T.accent, animation: "blink 1s infinite" }}>Extracting entities → building Cypher → assembling answer…</div>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 900, fontSize: 28, color: T.green, marginTop: 12 }}>{customGraphMs >= 1000 ? `${(customGraphMs/1000).toFixed(1)}s` : `${customGraphMs}ms`}</div>
                </Card>
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* Racing results — only shown for showcase queries */}
      {activeQuery && (
        <div>
          {/* Live timer banner */}
          <div style={{
            background: `linear-gradient(135deg, ${T.surface}, #0f1a2a)`,
            border: `1px solid ${T.border2}`,
            borderRadius: 10, padding: "16px 24px", marginBottom: 16,
            display: "flex", alignItems: "center", gap: 0,
          }}>
            {/* Question */}
            <div style={{ flex: 1, paddingRight: 24, borderRight: `1px solid ${T.border}` }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.muted, letterSpacing: 2, marginBottom: 6 }}>QUERY</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.text, lineHeight: 1.6, fontStyle: "italic" }}>"{activeQuery.question}"</div>
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <Badge label={activeQuery.icon + " " + activeQuery.label} color={T.accent} bg={T.accentDim} small />
                <Badge label={activeQuery.badge} color={T.muted} bg={T.dim} small />
              </div>
            </div>

            {/* SQL timer */}
            <div style={{ textAlign: "center", padding: "0 28px", borderRight: `1px solid ${T.border}` }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.red, letterSpacing: 2, marginBottom: 4 }}>SQL</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 900, fontSize: 40, color: sqlDone ? T.red : T.muted, lineHeight: 1, letterSpacing: -2, transition: "color 0.3s" }}>
                {sqlMs >= 1000 ? `${(sqlMs / 1000).toFixed(1)}s` : `${sqlMs}ms`}
              </div>
              {sqlDone && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.red, marginTop: 2 }}>✓ {activeQuery.sqlRows} scanned</div>}
              {!sqlDone && isRacing && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.muted, marginTop: 2, animation: "blink 1s infinite" }}>scanning…</div>}
            </div>

            {/* VS */}
            <div style={{ padding: "0 20px", fontFamily: "'DM Mono',monospace", fontSize: 12, color: T.muted }}>VS</div>

            {/* GraphRAG timer */}
            <div style={{ textAlign: "center", padding: "0 28px", borderRight: `1px solid ${T.border}` }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.green, letterSpacing: 2, marginBottom: 4 }}>GRAPHRAG</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 900, fontSize: 40, color: graphDone ? T.green : T.muted, lineHeight: 1, letterSpacing: -2, transition: "color 0.3s" }}>
                {graphMs >= 1000 ? `${(graphMs / 1000).toFixed(1)}s` : `${graphMs}ms`}
              </div>
              {graphDone && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.green, marginTop: 2 }}>✓ graph traversal</div>}
              {!graphDone && isRacing && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.muted, marginTop: 2, animation: "blink 1s infinite" }}>traversing…</div>}
            </div>

            {/* Speedup */}
            <div style={{ textAlign: "center", paddingLeft: 28, minWidth: 110 }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.muted, letterSpacing: 2, marginBottom: 2 }}>SPEED GAIN</div>
              <div style={{
                fontFamily: "'DM Sans',sans-serif", fontWeight: 900,
                fontSize: isDone ? 56 : 40,
                color: isDone ? T.green : T.muted,
                lineHeight: 1, letterSpacing: -3,
                transition: "all 0.5s ease",
                transform: isDone ? "scale(1)" : "scale(0.85)",
              }}>
                {isDone ? speedup : "—"}<span style={{ fontSize: isDone ? 28 : 20 }}>×</span>
              </div>
              {isDone && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.green }}>faster</div>}
            </div>
          </div>

          {/* Progress bars */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
            {[
              { label: "SQL EXECUTION", pct: sqlDone ? 100 : Math.min(99, (sqlMs / activeQuery.sqlMs) * 100), color: T.red, done: sqlDone, time: fmtMs(sqlDone ? activeQuery.sqlMs : sqlMs) },
              { label: "GRAPHRAG TRAVERSAL", pct: graphDone ? 100 : Math.min(99, (graphMs / activeQuery.graphMs) * 100), color: T.green, done: graphDone, time: fmtMs(graphDone ? activeQuery.graphMs : graphMs) },
            ].map(b => (
              <div key={b.label} style={{ background: T.card, border: `1px solid ${b.done ? b.color + "50" : T.border}`, borderRadius: 6, padding: "8px 12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: b.color, letterSpacing: 1 }}>{b.label}</span>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: b.done ? b.color : T.muted, fontWeight: 600 }}>{b.time}</span>
                </div>
                <div style={{ height: 5, background: T.dim, borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${b.pct}%`, background: b.color, borderRadius: 3, transition: isRacing ? "width 0.1s linear" : "width 0.4s ease" }} />
                </div>
              </div>
            ))}
          </div>

          {/* Full results grid — revealed after race completes */}
          {isDone && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, animation: "fade-up 0.5s ease" }}>

            {/* SQL side */}
            <Card style={{ borderTop: `3px solid ${T.red}` }}>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: T.red, letterSpacing: 2, marginBottom: 4 }}>🗄 AZURE SQL / RELATIONAL DB</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: T.muted }}>{activeQuery.sqlRows} rows scanned · {fmtMs(activeQuery.sqlMs)} execution</div>
              </div>

              {/* SQL plan */}
              <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, padding: "10px 14px", marginBottom: 10 }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.muted, letterSpacing: 2, marginBottom: 6 }}>QUERY PLAN</div>
                <SQLBlock code={activeQuery.sqlPlan} />
              </div>

              {/* SQL error */}
              {activeQuery.sqlError && (
                <div style={{ background: "#2d1515", border: `1px solid ${T.red}40`, borderRadius: 6, padding: "8px 12px", marginBottom: 10 }}>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.red, letterSpacing: 1, marginBottom: 4 }}>⚠ SQL FAILURE MODE</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: T.red, lineHeight: 1.6 }}>{activeQuery.sqlError}</div>
                </div>
              )}

              {/* SQL results */}
              <div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.muted, letterSpacing: 2, marginBottom: 6 }}>RESULT (PARTIAL / INCOMPLETE)</div>
                <ResultTable result={activeQuery.sqlResult} />
              </div>
            </Card>

            {/* GraphRAG side */}
            <Card style={{ borderTop: `3px solid ${T.green}` }}>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: T.green, letterSpacing: 2, marginBottom: 4 }}>🕸 NEO4J GRAPHRAG · CLAUDE SONNET</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: T.muted }}>traversal complete · {fmtMs(activeQuery.graphMs)} · zero row scans</div>
              </div>

              {/* Cypher */}
              <div style={{ background: T.bg, border: `1px solid ${T.green}50`, borderRadius: 6, padding: "10px 14px", marginBottom: 10 }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.green, letterSpacing: 2, marginBottom: 6 }}>NEO4J CYPHER — SINGLE ATOMIC QUERY</div>
                <CypherBlock code={activeQuery.cypher} />
              </div>

              {/* Graph results */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.muted, letterSpacing: 2, marginBottom: 6 }}>COMPLETE RESULT</div>
                <ResultTable result={activeQuery.graphResult} />
              </div>

              {/* Graph insight */}
              <div style={{ background: "#0a1a0f", border: `1px solid ${T.green}30`, borderRadius: 6, padding: "10px 14px" }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.green, letterSpacing: 2, marginBottom: 5 }}>🕸 GRAPH INSIGHT — IMPOSSIBLE IN SQL</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: T.muted, lineHeight: 1.7 }}>{activeQuery.graphInsight}</div>
              </div>

              {/* Speedup callout */}
              {isDone && (
                <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 14, animation: "fade-up 0.5s ease" }}>
                  <div style={{ flex: 1, height: 1, background: T.dim }} />
                  <div style={{ textAlign: "center" }}>
                    <span style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 900, fontSize: 32, color: T.green, letterSpacing: -1 }}>{speedup}×</span>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: T.muted }}> faster · complete results · no timeout</span>
                  </div>
                  <div style={{ flex: 1, height: 1, background: T.dim }} />
                </div>
              )}
            </Card>
          </div>
          )} {/* end isDone results */}

          {/* While racing — show loading skeleton */}
          {!isDone && phase === "racing" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, opacity: 0.4 }}>
              {[T.red, T.green].map((color, i) => (
                <Card key={i} style={{ borderTop: `3px solid ${color}`, minHeight: 180 }}>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color, letterSpacing: 2, marginBottom: 12 }}>{i === 0 ? "🗄 SQL / AZURE SQL DB" : "🕸 NEO4J GRAPHRAG"}</div>
                  {[90, 70, 50, 80, 60].map((w, j) => (
                    <div key={j} style={{ height: 10, background: T.dim, borderRadius: 4, marginBottom: 8, width: `${w}%`, animation: "blink 1.5s infinite", animationDelay: `${j * 0.2}s` }} />
                  ))}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Idle state */}
      {!activeQuery && customPhase === "idle" && (
        <Card style={{ textAlign: "center", padding: "50px 40px" }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>🏁</div>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 16, color: T.text, marginBottom: 8 }}>Pick a showcase query above to start the race</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: T.muted, lineHeight: 1.8 }}>
            Each query demonstrates a relationship-reasoning problem where SQL structurally fails.<br />
            GraphRAG wins on speed, completeness, and accuracy — every time.
          </div>
        </Card>
      )}
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════════════


export default function IcMGraphRAG(){
  const [tab,setTab]=useState("dashboard");
  const [selectedInc,setSelectedInc]=useState(null);
  const [presentMode,setPresentMode]=useState(false);
  const TABS=[
    {id:"dashboard",label:"📊 IcM Dashboard"},
    {id:"nlquery",  label:"💬 NL Query"},
    {id:"rca",      label:"🔍 RCA Explorer"},
    {id:"visualizer",label:"🕸 Graph Visualizer"},
    {id:"showdown", label:"📈 Query Showdown"},
    {id:"tsg",      label:"📚 TSG Recommender"},
  ];
  const openInc=(inc)=>{setSelectedInc(inc);setTab("rca");};
  return(
    <div style={{background:T.bg,minHeight:"100vh",color:T.text}}>
      <style>{`
        ${FONTS}
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-track{background:${T.surface};}
        ::-webkit-scrollbar-thumb{background:${T.border2};border-radius:2px;}
        @keyframes fade-up{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.2}}
        @keyframes sweep{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:none}}
        @keyframes scan{0%{transform:translateX(-100%)}100%{transform:translateX(400%)}}
        button{transition:all 0.15s;}
        button:hover{opacity:0.85;}
        input[type=range]{cursor:pointer;}
      `}</style>
      {presentMode&&<PresentationMode onClose={()=>setPresentMode(false)} onNavigate={setTab}/>}
      <div style={{background:T.surface,borderBottom:`1px solid ${T.border}`,padding:"0 24px"}}>
        <div style={{display:"flex",alignItems:"center",height:50,gap:16}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:26,height:26,background:T.accentDim,border:`1px solid ${T.accent}40`,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <div style={{width:11,height:11,background:T.accent,clipPath:"polygon(50% 0%,0% 100%,100% 100%)"}}/>
            </div>
            <div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:14,color:T.text,letterSpacing:-0.3}}>IcM <span style={{color:T.accent}}>GraphRAG</span></div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:T.muted,letterSpacing:1}}>{INCIDENTS.length} incidents</div>
            </div>
          </div>
          <div style={{display:"flex",gap:12,marginLeft:4}}>
            {[{label:INCIDENTS.filter(i=>i.status!=="Resolved").length+" OPEN",color:T.red},{label:INCIDENTS.filter(i=>["Sev0","Sev1"].includes(i.severity)).length+" SEV0/1",color:T.amber},{label:INCIDENTS.length+" TOTAL",color:T.muted}].map(s=><div key={s.label} style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:s.color}}>{s.label}</div>)}
          </div>
          <div style={{flex:1}}/>
          <button onClick={()=>setPresentMode(true)} style={{background:"linear-gradient(135deg,#1a3068,#2a1a60)",border:`1px solid ${T.accent}`,color:T.accent,fontFamily:"'DM Mono',monospace",fontSize:10,padding:"6px 14px",cursor:"pointer",borderRadius:6,letterSpacing:1,display:"flex",alignItems:"center",gap:6}}>
            🎬 DEMO MODE
          </button>
          <Badge label="Neo4j AuraDS" color={T.cyan} bg={T.dim}/>
        </div>
        <div style={{display:"flex",borderTop:`1px solid ${T.border}`,overflowX:"auto"}}>
          {TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{background:"transparent",border:"none",borderBottom:`2px solid ${tab===t.id?T.accent:"transparent"}`,color:tab===t.id?T.accent:T.muted,fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:11,padding:"9px 14px",cursor:"pointer",letterSpacing:0.2,whiteSpace:"nowrap"}}>{t.label}</button>)}
        </div>
      </div>
      <div style={{padding:22,maxWidth:1440,margin:"0 auto"}}>
        {tab==="dashboard"&&<Dashboard onSelect={openInc}/>}
        {tab==="nlquery"&&<NLQueryEngine/>}
        {tab==="rca"&&(selectedInc
          ?<IncidentDetail inc={selectedInc}/>
          :<div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:T.muted,marginBottom:16}}>Select an incident from the dashboard, or pick one below:</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {INCIDENTS.slice(0,15).map(inc=><div key={inc.id} onClick={()=>setSelectedInc(inc)} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:"14px 16px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:T.accent,marginRight:10}}>{inc.id}</span><span style={{fontFamily:"'DM Sans',sans-serif",fontWeight:500,fontSize:13,color:T.text}}>{inc.title}</span></div>
                <div style={{display:"flex",gap:8}}><SevBadge sev={inc.severity} small/><StatusDot status={inc.status}/></div>
              </div>)}
            </div>
          </div>
        )}
        {tab==="visualizer"&&<GraphVisualizer/>}
        {tab==="showdown"&&<QueryShowdown/>}
        {tab==="tsg"&&<TSGRecommender/>}
      </div>
    </div>
  );
}