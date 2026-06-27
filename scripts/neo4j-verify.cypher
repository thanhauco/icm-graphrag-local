// Verification queries after running neo4j-import-incidents.cypher

// Node counts
MATCH (i:Incident) RETURN 'Incident' AS label, count(i) AS count
UNION ALL
MATCH (s:Service) RETURN 'Service' AS label, count(s) AS count
UNION ALL
MATCH (c:Component) RETURN 'Component' AS label, count(c) AS count
UNION ALL
MATCH (t:Team) RETURN 'Team' AS label, count(t) AS count
UNION ALL
MATCH (cr:ChangeRequest) RETURN 'ChangeRequest' AS label, count(cr) AS count
UNION ALL
MATCH (t:TSG) RETURN 'TSG' AS label, count(t) AS count;

// Relationship counts
MATCH ()-[r:AFFECTS]->() RETURN 'AFFECTS' AS rel, count(r) AS count
UNION ALL
MATCH ()-[r:ASSIGNED_TO]->() RETURN 'ASSIGNED_TO' AS rel, count(r) AS count
UNION ALL
MATCH ()-[r:ROOT_CAUSE]->() RETURN 'ROOT_CAUSE' AS rel, count(r) AS count
UNION ALL
MATCH ()-[r:TRIGGERED_BY]->() RETURN 'TRIGGERED_BY' AS rel, count(r) AS count
UNION ALL
MATCH ()-[r:RESOLVED_BY]->() RETURN 'RESOLVED_BY' AS rel, count(r) AS count
UNION ALL
MATCH ()-[r:SIMILAR_TO]->() RETURN 'SIMILAR_TO' AS rel, count(r) AS count;

// Sanity check: should be 400
MATCH (i:Incident) RETURN count(i) AS incidentCount;

// Sample graph slice for one major incident
MATCH (i:Incident {id:'INC-2901'})
OPTIONAL MATCH (i)-[:AFFECTS]->(s:Service)
OPTIONAL MATCH (i)-[:TRIGGERED_BY]->(cr:ChangeRequest)
OPTIONAL MATCH (i)-[:RESOLVED_BY]->(tsg:TSG)
OPTIONAL MATCH (i)-[:ROOT_CAUSE]->(c:Component)
OPTIONAL MATCH (i)-[:ASSIGNED_TO]->(t:Team)
RETURN i.id, i.title,
       collect(DISTINCT s.id) AS affectedServices,
       collect(DISTINCT cr.id) AS triggeringCR,
       collect(DISTINCT tsg.id) AS resolvedBy,
       collect(DISTINCT c.id) AS rootComponent,
       collect(DISTINCT t.id) AS team;
