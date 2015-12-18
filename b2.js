'use strict'
function Vector(start_x, start_y, end_x, end_y) {
  this.s_x = start_x;
  this.s_y = start_y;
  this.e_x = end_x;
  this.e_y = end_y;
}
Vector.prototype.is_point = function() {
  if (this.s_x == this.e_x && this.s_y == this.e_y) return true;
  return false;
}
Vector.prototype.add = function(vec) {
  return new Vector(this.s_x, this.s_y, this.e_x + (vec.e_x - vec.s_x), this.e_y + (vec.e_y - vec.s_x));
}
Vector.prototype.min = function(vec) {
  return new Vector(this.s_x, this.s_y, this.e_x - (vec.e_x - vec.s_x), this.e_y - (vec.e_y - vec.s_x));
}
Vector.prototype.dot = function(vec) {
  return ((this.e_x - this.s_x) * (vec.e_x - vec.s_x) + (this.e_y - this.s_y) * (vec.e_y - vec.s_y));
}
Vector.prototype.cross = function(vec) {
  return (this.e_x - this.s_x) * (vec.e_y - vec.s_y) - (this.e_y - this.s_y) * (vec.e_x - vec.s_x);
}
Vector.prototype.scalar_dot = function(sc) {
  this.e_x += (sc - 1) * (this.e_x - this.s_x);
  this.e_y += (sc - 1) * (this.e_y - this.s_y);
  return this;
}
Vector.prototype.size = function() {
  return Math.sqrt((this.e_x - this.s_x) * (this.e_x - this.s_x) + (this.e_y - this.s_y) * (this.e_y - this.s_y));
}
Vector.prototype.get_unit = function() {
  var len = this.size();
  return new Vector(this.s_x, this.s_y, this.s_x + (this.e_x - this.s_x) / len, this.s_y + (this.e_y - this.s_y) / len);
}

// Rotate the vector by theta using starting point of a vector as an orgin (clockwise)
Vector.prototype.rotate = function(theta) {
  var x_t = this.e_x - this.s_x,
    y_t = this.e_y - this.s_y;
  this.e_x = this.s_x + Math.cos(theta) * x_t - Math.sin(theta) * y_t;
  this.e_y = this.s_y + Math.sin(theta) * x_t + Math.cos(theta) * y_t;
  return this;
}

// Move entire vector by vec
Vector.prototype.trasfer = function(vec) {
    this.s_x += (vec.e_x - vec.s_x);
    this.e_x += (vec.e_x - vec.s_x);
    this.s_y += (vec.e_y - vec.s_y);
    this.e_y += (vec.e_y - vec.s_y);
    return this;
  }
  // project a point (x, y) onto this
Vector.prototype.project_point = function(x, y) {
    // vector pointing to the (x, y)
    var point = new Vector(this.s_x, this.s_y, x, y);

    var unit = this.get_unit();
    var prj_len = unit.dot(point);

    var prj_vec = unit.scalar_dot(prj_len);

    return {
      x: prj_vec.e_x,
      y: prj_vec.e_y
    };
  }
  // project vec onto this
Vector.prototype.project_vec = function(vec) {
  var start = this.project_point(vec.s_x, vec.s_y);
  var end = this.project_point(vec.e_x, vec.e_y);
  return new Vector(start.x, start.y, end.x, end.y);
}

// check whether point (x, y) is included in vec
Vector.prototype.contains_point = function(x, y) {
  if (x == this.s_x && y == this.s_y) return true;
  if (x == this.e_x && y == this.e_y) return true;

  if (Math.abs((y - this.s_y) * (this.e_x - x) - (this.e_y - y) * (x - this.s_x)) < 0.00001) {
    if (((this.s_x <= x && x <= this.e_x) || (this.s_x >= x && x >= this.e_x)) && ((this.s_y <= y && y <= this.e_y) || (this.s_y >= y && y >= this.e_y))) {
      return true;
    }
  }
  return false;
}
Vector.prototype.is_meeting = function(vec) {
  if (this.contains_point(vec.s_x, vec.s_y) || this.contains_point(vec.e_x, vec.e_y)) return true;
  if (vec.contains_point(this.s_x, this.s_y) || vec.contains_point(this.e_x, this.e_y)) return true;

  var vecl = new Vector(this.s_x, this.s_y, vec.s_x, vec.s_y);
  var vec2 = new Vector(this.s_x, this.s_y, vec.e_x, vec.e_y);

  if (vecl.cross(this) * vec2.cross(this) >= 0) return false;

  var vec3 = new Vector(vec.s_x, vec.s_y, this.s_x, this.s_y);
  var vec4 = new Vector(vec.s_x, vec.s_y, this.e_x, this.e_y);

  if (vec3.cross(vec) * vec4.cross(vec) >= 0) return false;
  return true;
}
Vector.prototype.meeting_point = function(vec) {
  if (!this.is_meeting(vec)) return false;
  // If two lines ane pararell, then those vectors are overlapping each other
  if (Math.abs((this.s_x - this.e_x) * (vec.s_y - vec.e_y) - (this.s_y - this.e_y) * (vec.s_x - vec.e_x)) < 0.0000001) {
    var arr = [this.s_x, this.e_x, vec.s_x, vec.e_x];
    arr.sort();

    var start_x = arr[1],
      end_x = arr[2];
    arr = [this.s_y, this.e_y, vec.s_y, vec.e_y];

    arr.sort();
    var start_y = arr[1],
      end_y = arr[2];

    return new Vector(start_x, start_y, end_x, end_y);
  }

  // If not, then we can pinpoint the location
  var x = ((this.s_x * this.e_y - this.s_y * this.e_x) * (vec.s_x - vec.e_x) - (this.s_x - this.e_x) * (vec.s_x * vec.e_y - vec.s_y * vec.e_x));
  var y = ((this.s_x * this.e_y - this.s_y * this.e_x) * (vec.s_y - vec.e_y) - (this.s_y - this.e_y) * (vec.s_x * vec.e_y - vec.s_y * vec.e_x));
  x /= ((this.s_x - this.e_x) * (vec.s_y - vec.e_y) - (this.s_y - this.e_y) * (vec.s_x - vec.e_x));
  y /= ((this.s_x - this.e_x) * (vec.s__y - vec.e_y) - (this.s_y - this.e_y) * (vec.s_x - vec.e_x));
  return new Vector(x, y, x, y);
}
Vector.prototype.draw = function(ctx, color) {
  if (!color) {
    color = 'blue'; // Default Color :: Blue
  }

  // If it is just a point
  if (this.s_x == this.e_x && this.s_y == this.e_y) {
    ctx.fillStyle = color;
    ctx.fillRect(this.s_x, this.s_y, 1, 1);
    return;
  }
  ctx.strokeStyle = color
  ctx.lineWidth = '1';
  var path = new Path2D();
  path.moveTo(this.s_x, this.s_y);
  path.lineTo(this.e_x, this.e_y);
  ctx.stroke(path);
}

function Polygon(edges) {
  this.edges = edges
}
Polygon.prototype.draw = function(ctx) {
  var path = new Path2D()

  for (var i = 0; i < this.edges.length; i++) {

    path.moveTo(this.edges[i].s_x, this.edges[i].s_y);
    path.lineTo(this.edges[i].e_x, this.edges[i].e_y);

  }

  ctx.lineWidth = '1';
  ctx.strokeStyle = 'blue';
  ctx.stroke(path);
}

Polygon.prototype.create_rect = function(x, y, w, h, theta) {
  var arr = [];
  if (!theta) theta = 0;

  var top = new Vector(x, y, x + w, y);
  arr.push(top.rotate(theta));
  var right = new Vector(top.e_x, top.e_y, top.e_x, top.e_y + h);
  arr.push(right.rotate(theta));
  var btn = new Vector(right.e_x, right.e_y, right.e_x - w, right.e_y);
  arr.push(btn.rotate(theta));
  var left = new Vector(btn.e_x, btn.e_y, btn.e_x, btn.e_y - h);
  arr.push(left.rotate(theta));
  this.edges = arr;
}

// check SAT satisfiability with pol's edges
Polygon.prototype.sat_chk_one = function(pol) {
  function within_range(a1, a2, b1, b2) {
    if (a1 > a2) {
      var t = a2;
      a2 = a1;
      a1 = t;
    }
    if (b1 > b2) {
      var t = b2;
      b2 = b1;
      b1 = t;
    }
    if (b2 <= a1 || a2 <= b1) return false;
    return true;
  }
  // check with my every edges
  for (var i = 0; i < this.edges.length; i++) {
    var edge = this.edges[i];
    var overlap_found = false;
    for (var j = 0; j < pol.edges.length; j++) {
      var prj = edge.project_vec(pol.edges[j]);
      if (within_range(edge.s_x, edge.e_x, prj.s_x, prj.e_x) || within_range(edge.s_y, edge.e_y, prj.s_y, prj.e_y)) {
        overlap_found = true;
        break;
      }
    }
    if (!overlap_found) return false;
  }
  return true;
}
Polygon.prototype.sat_chk = function(pol) {
  if (this.sat_chk_one(pol) && pol.sat_chk_one(this)) return true;
  return false;
}
