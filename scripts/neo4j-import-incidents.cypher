// Neo4j import script for exports/incidents.csv
// Usage:
// 1) Copy incidents.csv into Neo4j import directory
// 2) In Neo4j Browser, run this script
// 3) Verify with scripts/neo4j-verify.cypher

// Constraints
CREATE CONSTRAINT incident_id IF NOT EXISTS FOR (n:Incident) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT service_id IF NOT EXISTS FOR (n:Service) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT component_id IF NOT EXISTS FOR (n:Component) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT team_id IF NOT EXISTS FOR (n:Team) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT change_request_id IF NOT EXISTS FOR (n:ChangeRequest) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT tsg_id IF NOT EXISTS FOR (n:TSG) REQUIRE n.id IS UNIQUE;

// Helpful indexes
CREATE INDEX incident_status IF NOT EXISTS FOR (n:Incident) ON (n.status);
CREATE INDEX incident_severity IF NOT EXISTS FOR (n:Incident) ON (n.severity);

// 1) Load Incident nodes
LOAD CSV WITH HEADERS FROM 'file:///incidents.csv' AS row
WITH row WHERE row.id IS NOT NULL AND trim(row.id) <> ''
MERGE (i:Incident {id: trim(row.id)})
SET i.title = row.title,
    i.severity = row.severity,
    i.status = row.status,
    i.createdAt = CASE WHEN row.createdAt IS NULL OR trim(row.createdAt) = '' THEN NULL ELSE datetime(row.createdAt) END,
    i.resolvedAt = CASE WHEN row.resolvedAt IS NULL OR trim(row.resolvedAt) = '' THEN NULL ELSE datetime(row.resolvedAt) END,
    i.mttr = row.mttr,
    i.mttrMinutes = CASE WHEN row.mttr IS NULL OR trim(row.mttr) = '' THEN NULL ELSE toInteger(split(row.mttr, ' ')[0]) END,
    i.errorCode = row.errorCode,
    i.customerImpact = row.customerImpact,
    i.summary = row.summary,
    i.region = row.region;

// 2) Incident -> Team (ASSIGNED_TO)
LOAD CSV WITH HEADERS FROM 'file:///incidents.csv' AS row
WITH row
WHERE row.id IS NOT NULL AND trim(row.id) <> ''
  AND row.team IS NOT NULL AND trim(row.team) <> ''
MATCH (i:Incident {id: trim(row.id)})
MERGE (t:Team {id: trim(row.team)})
MERGE (i)-[:ASSIGNED_TO]->(t);

// 3) Incident -> Service (AFFECTS), pipe-delimited list
LOAD CSV WITH HEADERS FROM 'file:///incidents.csv' AS row
WITH row, [svc IN split(coalesce(row.affectedServices, ''), '|') WHERE trim(svc) <> ''] AS svcIds
WHERE row.id IS NOT NULL AND trim(row.id) <> ''
MATCH (i:Incident {id: trim(row.id)})
UNWIND svcIds AS svcId
MERGE (s:Service {id: trim(svcId)})
MERGE (i)-[:AFFECTS]->(s);

// 4) Incident -> Component (ROOT_CAUSE)
LOAD CSV WITH HEADERS FROM 'file:///incidents.csv' AS row
WITH row
WHERE row.id IS NOT NULL AND trim(row.id) <> ''
  AND row.rootComponent IS NOT NULL AND trim(row.rootComponent) <> ''
MATCH (i:Incident {id: trim(row.id)})
MERGE (c:Component {id: trim(row.rootComponent)})
MERGE (i)-[:ROOT_CAUSE]->(c);

// 5) Incident -> ChangeRequest (TRIGGERED_BY)
LOAD CSV WITH HEADERS FROM 'file:///incidents.csv' AS row
WITH row
WHERE row.id IS NOT NULL AND trim(row.id) <> ''
  AND row.triggeredBy IS NOT NULL AND trim(row.triggeredBy) <> ''
MATCH (i:Incident {id: trim(row.id)})
MERGE (cr:ChangeRequest {id: trim(row.triggeredBy)})
MERGE (i)-[:TRIGGERED_BY]->(cr);

// 6) Incident -> TSG (RESOLVED_BY)
LOAD CSV WITH HEADERS FROM 'file:///incidents.csv' AS row
WITH row
WHERE row.id IS NOT NULL AND trim(row.id) <> ''
  AND row.resolvedBy IS NOT NULL AND trim(row.resolvedBy) <> ''
MATCH (i:Incident {id: trim(row.id)})
MERGE (t:TSG {id: trim(row.resolvedBy)})
MERGE (i)-[:RESOLVED_BY]->(t);

// 7) Incident -> Incident (SIMILAR_TO), pipe-delimited list
LOAD CSV WITH HEADERS FROM 'file:///incidents.csv' AS row
WITH row, [sid IN split(coalesce(row.similarIncidents, ''), '|') WHERE trim(sid) <> ''] AS similarIds
WHERE row.id IS NOT NULL AND trim(row.id) <> ''
MATCH (i:Incident {id: trim(row.id)})
UNWIND similarIds AS sid
MERGE (j:Incident {id: trim(sid)})
MERGE (i)-[:SIMILAR_TO]->(j);
