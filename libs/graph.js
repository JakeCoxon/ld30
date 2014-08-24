function Graph() {
  this.vertices = [];
  this.edges = [];
  this.edgeMap = new HashMap();
  this.vertexMap = new HashMap();
}

Graph.prototype.addVertex = function(v) {
  this.vertices.push(v);
  this.vertexMap.set(v, []);
};
Graph.prototype.addEdge = function(e, vertices) {
  this.edges.push(e);
  this.edgeMap.set(e, vertices.slice(0));
  _.forEach( vertices, function( v ) {
    this.vertexMap.get(v).push(e);
  }.bind(this) );
  
};

Graph.prototype.isNeighbour = function( v1, v2 ) {
  return !!this.getJoiningEdge( v1, v2 );
};

Graph.prototype.getNeighbours = function( v ) {
  var neighbours = [];
  _.forEach( this.vertexMap.get(v), function( edge ) {
    neighbours.push( this.getNeighbour( v, edge ) );
  }.bind( this ) );
  return neighbours;
};

Graph.prototype.getNeighbour = function( v, e ) {
  var vertices = this.edgeMap.get(e);
  if ( v == vertices[ 0 ] ) return vertices[ 1 ];
  if ( v == vertices[ 1 ] ) return vertices[ 0 ];
};

Graph.prototype.getIncidentVertices = function( e ) {
  return this.edgeMap.get( e );
};

Graph.prototype.getJoiningEdge = function( v1, v2 ) {
  var returnEdge = null;
  this.edgeMap.forEach( function( vertices, edge ) {
    if ( vertices[ 0 ] == v1 && vertices[ 1 ] == v2 || 
         vertices[ 0 ] == v2 && vertices[ 1 ] == v1 )
      returnEdge = edge;
  } );
  return returnEdge;
}