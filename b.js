'use strict'
var world = cv_world.getContext('2d');

function dist(x, y) {
  return Math.sqrt(x * x + y * y);
}

function Ball(x, y, r, spd, type) {
  // Ball Location
  this.x = x; this.y = y; this.prev_x = x; this.prev_y = y;
  // Ball Radius
  this.r = r;
  // Ball Speed
  this.spd = spd;
  // Where the ball heads to (Vector)
  this.heading = {x : 1/3, y : 1/2};
  this.prev_collided = {
    brick: null,
    where: ''
  };
  if (!type) type = 'normal';
  this.type = type;
}
Ball.prototype.draw = function() {
  world.fillStyle = 'black';
  world.beginPath();
  world.arc(this.x, this.y, this.r, 0, 2 * 3.141592);
  world.fill();
}
Ball.prototype.move = function(t) {
  // Normalize heading
  var x = this.heading.x; var y = this.heading.y;
  this.heading.x = x / Math.sqrt(x * x + y * y);
  this.heading.y = y / Math.sqrt(x * x + y * y);
  this.prev_x = this.x;
  this.prev_y = this.y;
  this.x += this.heading.x * this.spd * t;
  this.y += this.heading.y * this.spd * t;
}
Ball.prototype.next_move = function() {
  var diff = dist(this.prev_x - this.x, this.prev_y - this.y);
  // Normalize heading
  var x = this.heading.x; var y = this.heading.y;
  this.heading.x = x / Math.sqrt(x * x + y * y);
  this.heading.y = y / Math.sqrt(x * x + y * y);
  return {
    x: this.x + this.heading.x * diff,
    y: this.y + this.heading.y * diff
  };
}
Ball.prototype.log = function() {
  var s = '[ (' + this.x.toFixed(5) + ',' + this.y.toFixed(5) + ')';
  s += 'r: ' + this.r + 'speed: ' + this.spd;
  s += ' head :: ' + this.heading.x.toFixed(5) + ' , ' + this.heading.y.toFixed(5);
  s += ' (' + this.prev_x.toFixed(5) + ' , ' + this.prev_y.toFixed(5) + ')]';
  return s;
}

function Brick(x, y, w, h, max, type, color) {
  // The coordinate starts from top-left corner
  this.x = x; this.y = y; this.w = w; this.h = h;
  this.collision_count = 0;
  this.max_collision = max;
  if (!color) color = 'orange';
  this.color = color;
  if (!type) type = 'normal';
  this.type = type
}
Brick.prototype.draw = function() {
  world.fillStyle = this.color;
  world.fillRect(this.x, this.y, this.w, this.h);
  world.strokeStyle = 'blue';
  world.strokeRect(this.x, this.y, this.w, this.h)
  world.fillStyle = 'black';
  if (this.max_collision - this.collision_count <= 9) world.fillText(this.max_collision - this.collision_count, this.x + this.w / 2 - 4, this.y + this.h / 2 + 3);
  else if (this.max_collision - this.collision_count <= 99) world.fillText(this.max_collision - this.collision_count, this.x + this.w / 2 - 6, this.y + this.h / 2 + 4);
  else if (this.max_collision - this.collision_count <= 999) world.fillText(this.max_collision - this.collision_count, this.x + this.w / 2 - 10, this.y + this.h / 2 + 4);
}
Brick.prototype.get_edge_vector = function(where) {
  if (where == 'top_h') {
    return new Vector(this.x, this.y, this.x + this.w, this.y);
  }
  if (where == 'right_v') {
    return new Vector(this.x + this.w, this.y, this.x + this.w, this.y + this.h)
  }
  if (where == 'bottom_h') {
    return new Vector(this.x + this.w, this.y + this.h, this.x, this.y + this.h)
  }
  if (where == 'left_v') {
    return new Vector(this.x, this.y + this.h, this.x, this.y);
  }
}
Brick.prototype.chk_edge_contains = function(edge) {
  var brick_edges = [];
  brick_edges.push(new Vector(this.x, this.y, this.x + this.w, this.y));
  brick_edges.push(new Vector(this.x + this.w, this.y, this.x + this.w, this.y + this.h));
  brick_edges.push(new Vector(this.x + this.w, this.y + this.h, this.x, this.y + this.h));
  brick_edges.push(new Vector(this.x, this.y + this.h, this.x, this.y));
  for (var i = 0; i < 4; i++) {
    if (brick_edges[i].contains_point(edge.s_x, edge.s_y) && brick_edges[i].contains_point(edge.e_x, edge.e_y)) return true;
  }
  return false;
}

function Collision(ball, rect) {
  this.rect = rect;
  this.ball = ball;
  this.right_e_meet = new Array()
  this.left_e_meet = new Array();
}
Collision.prototype.after_collision = function(result) {
  this.set_course(result);
}
Collision.prototype.set_course = function(result) {
  function random_reflex(ball) {
    var rand = Math.random();
    if (rand <= 0.2) rand += 0.1;
    else if (rand >= 0.2) rand -= 0.1;
    ball.heading.x = ball.heading.x / Math.abs(ball.heading.x) * rand;
    ball.heading.y = ball.heading.y / Math.abs(ball.heading.y) * Math.sqrt(l - rand * rand);
  }
  var pos = this.set_pos(result);
  if (!pos) return;
  if (result.direct == 'return') {
    this.ball.heading.x *= -1;
    this.ball.heading.y *= -1;
    this.ball.x = pos.x;
    this.ball.y = pos.y;
  } else {
    this.ball.x = pos.x;
    this.ball.y = pos.y;
    if (result.direct === 'right_v' || result.direct === 'left_v') {
      this.ball.heading.x *= -1;
    } else this.ball.heading.y *= -1;
    if (result.brick.type == 'random_reflex') {
      random_reflex(this.ball);
    }
  }
}
Collision.prototype.set_pos = function(result) {
  // Before setting the position of the ball, we have to check the
  // sanity of the collision (make sure that the ball has not bounced back
  // from where it did right before)
  if (this.ball.prev_collided.brick && result.direct != 'return' && this.ball.prev_collided.brick.chk_edge_contains(result.brick.get_edge_vector(result.direct))) {
    return false;
  }
  var x, y;
  if (result.direct == 'left_v') {
    x = result.brick.x - this.ball.r;
    y = this.ball.prev_y + (x - this.ball.prev_x) * (this.ball.heading.y / this.ball.heading.x);
  }
  if (result.direct == 'right_v') {
    x = result.brick.x + result.brick.w + this.ball.r;
    y = this.ball.prev_y - (this.ball.prev_x - x) * (this.ball.heading.y / this.ball.heading.x);
  }
  if (result.direct == 'top_h') {
    y = result.brick.y - this.ball.r;
    x = this.ball.prev_x + (y - this.ball.prev_y) * (this.ball.heading.x / this.ball.heading.y);
  }
  if (result.direct == 'bottom_h') {
    y = result.brick.y + result.brick.h + this.ball.r;
    x = this.ball.prev_x - (this.ball.prev_y - y) * (this.ball.heading.x / this.ball.heading.y);
  }
  if (result.direct == 'return') {
    x = this.ball.prev_x;
    y = this.ball.prev_y;
  }
  this.ball.prev_collided.brick = result.brick;
  this.ball.prev_collided.where = result.direct;
  result.brick.collision_count++;
  if (result.brick.collision_count == result.brick.max_collision) {
    for (var i = 0; i < game.brick_list.length; i++) {
      if (result.brick == game.brick_list[i]) {
        game.brick_list.splice(i, 1);
        game.poly_list.splice(i, 1);
        game.score += result.brick.max_collision;
      }
    }
    if (result.brick.type == 'add_ball') {
      game.total_balls += 1;
      game.score += 10;
    } else if (result.brick.type == 'boss') {
      var b_x = result.brick.x + result.brick.w / 2;
      var b_y = result.brick.y + result.brick.h / 2;
      game.add_ball(b_x, b_y, 3, 300 / 1000, {
        x: 1,
        y: 1
      });
      game.add_ball(b_x, b_y, 3, 300 / 1000, {
        x: 0,
        y: 1
      });
      game.add_ball(b_x, b_y, 3, 300 / 1000, {
        x: -1,
        y: 1
      });
      game.add_ball(b_x, b_y, 3, 300 / 1000, {
        x: -1,
        y: -1
      });
      game.add_ball(b_x, b_y, 3, 300 / 1000, {
        x: 0,
        y: -1
      });
      game.add_ball(b_x, b_y, 3, 300 / 1000, {
        x: 1,
        y: -1
      });
      game.add_ball(b_x, b_y, 3, 300 / 1000, {
        x: 1,
        y: 1
      });
      game.add_ball(b_x, b_y, 3, 300 / 1000, {
        x: 0,
        y: 1
      });
      game.add_ball(b_x, b_y, 3, 300 / 1000, {
        x: -1,
        y: 1
      });
      game.add_ball(b_x, b_y, 3, 300 / 1000, {
        x: -1,
        y: -1
      });
      game.add_ball(b_x, b_y, 3, 300 / 1000, {
        x: 0,
        y: -1
      });
      game.add_ball(b_x, b_y, 3, 300 / 1000, {
        x: 1,
        y: -1
      });
      game.add_ball(b_x, b_y, 3, 300 / 1000, {
        x: 1,
        y: 1
      });
      game.add_ball(b_x, b_y, 3, 300 / 1000, {
        x: 0,
        y: 1
      });
      game.add_ball(b_x, b_y, 3, 300 / 1000, {
        x: -1,
        y: 1
      });
      game.add_ball(b_x, b_y, 3, 300 / 1000, {
        x: -1,
        y: -1
      });
      game.add_ball(b_x, b_y, 3, 300 / 1000, {
        x: 0,
        y: -1
      });
      game.add_ball(b_x, b_y, 3, 300 / 1000, {
        x: 1,
        y: -1
      });
      game.total_balls += 1;
      game.score += result.brick.max_collision * 2;
    }
  }
  return {
    x: x,
    y: y
  };
}
Collision.prototype.chk_collision = function() {
  this.right_e_meet.sort(function(x, y) {
    return x.dist > y.dist
  });
  this.left_e_meet.sort(function(x, y) {
    return x.dist > y.dist
  });
  // if both arrays are empty then there was no collision
  if (!this.right_e_meet.length && !this.left_e_meet.length) return false;
  else if (!this.right_e_meet.length) {
    return {
      direct: this.left_e_meet[0].where,
      brick: this.left_e_meet[0].brick,
      info: [this.left_e_meet[0]]
    };
  } else if (!this.left_e_meet.length) {
    return {
      direct: this.right_e_meet[0].where,
      brick: this.right_e_meet[0].brick,
      info: [this.right_e_meet[0]]
    };

  }
  // if both edge vectors have intersection with other brick edges
  var left = this.left_e_meet[0],  right = this.right_e_meet[0];
  // Then the ball must have hit the corner of the brick (not the edge)
  // So instead of reflecting, the ball just goes back to where it came from
  if (left.brick == right.brick && left.where != right.where) {
    return {
      direct: 'return',
      brick: right.brick,
      info: [left, right]
    };
  } else if (left.brick == right.brick) {
    return {
      direct: right.where,
      brick: right.brick,
      info: [left, right]
    };
  }
  // If bricks are different, then we take the one that has smaller dist
  else if (left.dist > right.dist) {
    return {
      direct: right.where,
      brick: right.brick,
      info: [left, right]
    };
  } else {
    return {
      direct: left.where,
      brick: left.brick,
      info: [left, right]
    };
  }
}
Collision.prototype.chk_collision_brick = function(brick) {
  var right_e = this.rect.edges[1]; // right edge
  var left_e = this.rect.edges[3]; // left edge
  if (this.ball.heading.x >= 0) {
    this.edge_dist_add_arr(this.right_e_meet, right_e, brick, 'left_v');
    this.edge_dist_add_arr(this.left_e_meet, left_e, brick, 'left_v');
  }

  if (this.ball.heading.x <= 0) {
    this.edge_dist_add_arr(this.right_e_meet, right_e, brick, 'right_v');
    this.edge_dist_add_arr(this.left_e_meet, left_e, brick, 'right_v');
  }

  if (this.ball.heading.y >= 0) {
    this.edge_dist_add_arr(this.right_e_meet, right_e, brick, 'top_h');
    this.edge_dist_add_arr(this.left_e_meet, left_e, brick, 'top_h');
  }

  if (this.ball.heading.y <= 0) {
    this.edge_dist_add_arr(this.right_e_meet, right_e, brick, 'bottom_h');
    this.edge_dist_add_arr(this.left_e_meet, left_e, brick, 'bottom_h');
  }
}
Collision.prototype.edge_dist_add_arr = function(arr, edge, brick, where) {
  var res = this.edge_meeting(edge, brick, where, this.ball.prev_x, this.ball.prev_y);
  if (res != -1) arr.push({
    brick: brick,
    where: where,
    dist: res
  });
}
Collision.prototype.edge_meeting = function(edge, brick, where, orgin_x, orgin_y) {
  var brick_vec;
  if (where == 'top_h') {
    brick_vec = new Vector(brick.x, brick.y, brick.x + brick.w, brick.y);
  } else if (where == 'left_v') {
    brick_vec = new Vector(brick.x, brick.y, brick.x, brick.y + brick.h);
  } else if (where == 'right_v') {
    brick_vec = new Vector(brick.x + brick.w, brick.y, brick.x + brick.w, brick.y +
      brick.h);
  } else if (where == 'bottom_h') {
    brick_vec = new Vector(brick.x, brick.y + brick.h, brick.x + brick.w, brick.y +
      brick.h);
  }
  var intersect = edge.meeting_point(brick_vec);
  if (intersect) {
    return Math.min(dist(orgin_x - intersect.s_x, orgin_y - intersect.s_y),
      dist(orgin_x - intersect.e_x, orgin_y - intersect.e_y));
  }
  return -1; // if edge and brick does not meet
}

function Game() {
  this.ball_list = new Array();
  this.brick_list = new Array();
  this.poly_list = new Array();

  this.prev_draw_stamp = 0;
  this.current_level = 0;
  this.total_balls = 1;

  this.score = 0;
  this.is_game_over = false;

  this.brick_width = 40;
  this.brick_height = 20;

  this.num_brick_w = 6;
  this.num_brick_h = 8;

  this.stage_begin = false;
  this.user_select_path = null;

  this.angle_good = false;
  this.stage_first_hit = true;
  this.last_ball_x = this.brick_width * this.num_brick_w / 2;

  this.done_fire = false;
  this.test_mode_enable = false;
  this.red_flag = false;

  this.pop_up_text_arr = new Array();

  this.add_brick(-10, -30, this.brick_width * this.num_brick_w + 20, 30); // Top
  this.add_brick(-30, -10, 30, this.brick_height * this.num_brick_h + 20); // Left
  this.add_brick(this.brick_width * this.num_brick_w, -10, 30, this.brick_height * this.num_brick_h + 20); // Right
  this.add_brick(-10, this.brick_height * this.num_brick_h, this.brick_width * this.num_brick_w + 20, 30); // bottom

  this.add_polygon(-10, -30, this.brick_width * this.num_brick_w + 20, 30); // Top
  this.add_polygon(-30, -10, 30, this.brick_height * this.num_brick_h + 20); // Left
  this.add_polygon(this.brick_width * this.num_brick_w, -10, 30, this.brick_height * this.num_brick_h + 20); // Right
  this.add_polygon(-10, this.brick_height * this.num_brick_h, this.brick_width * this.num_brick_w + 20, 30); // bottom

  cv_world.onclick = this.user_click.bind(this);
  cv_world.onmousemove = this.user_mouse.bind(this);
}

Game.prototype.add_ball = function(x, y, r, spd, heading) {
  if (!heading) heading = {
    x: 1 / 2,
    y: 1 / 2
  };
  var h_dist = Math.sqrt(heading.x * heading.x + heading.y * heading.y);
  heading.x /= h_dist;
  heading.y /= h_dist;
  var b = new Ball(x, y, r, spd);
  b.heading = heading;
  this.ball_list.push(b);
}
Game.prototype.add_brick = function(x, y, w, h, max, type, color) {
  this.brick_list.push(new Brick(x, y, w, h, max, type, color));
}
Game.prototype.add_polygon = function(x, y, w, h, max) {
  this.poly_list.push(new Polygon());
  this.poly_list[this.poly_list.length - 1].create_rect(x, y, w, h);
}

// time is in millisec
Game.prototype.add_popup = function(s, time) {
  this.pop_up_text_arr.push({
    s: s,
    time: Date.now() + time
  });
}

Game.prototype.tick = function(t) {
  for (var i = 0; i < this.ball_list.length; i++) {
    this.ball_list[i].move(t);
  }
  for (var i = 0; i < this.ball_list.length; i++) {
    if (this.red_flag) {
      this.red_flag = false;
      this.ball_list = [];
      break;
    }
    var ball = this.ball_list[i];
    // Create a rectangle surrounding the prev ball and current ball
    var rect_x = ball.prev_x - ball.r * (ball.heading.x + ball.heading.y);
    var rect_y = ball.prev_y - ball.r * (ball.heading.y - ball.heading.x);
    var rect = new Polygon();
    rect.create_rect(rect_x, rect_y, 2 * ball.r, 2 * ball.r + dist(ball.prev_x - ball.x, ball.prev_y - ball.y),
      Math.PI / 2 + Math.atan(ball.heading.y / ball.heading.x) + (ball.heading.x > 0 ? Math.PI : 0));
    var coll = new Collision(this.ball_list[i], rect);

    for (var j = 0; j < this.brick_list.length; j++) {
      coll.chk_collision_brick(this.brick_list[j]);
    }

    var res = coll.chk_collision();
    if (res) {
      if (this.test_mode_enable) {
        console.log('Before Hit :: ' + ball.log());
        console.dir(res);
      }

      coll.after_collision(res);
      if (this.test_mode_enable) {
        console.log('After Hit :: ' + ball.logO);
      }
      if (res.brick == this.brick_list[3]) {
        if (this.stage_first_hit) {
          this.last_ball_x = this.ball_list[i].x;
          this.stage_first_hit = false;
        }
        this.ball_list.splice(i, 1);
        i--;
      } else if (res.brick.type == 'sticky') {
        this.ball_list.splice(i, 1);
        i--;
      }
    }
  }
  if (!this.ball_list.length && this.stage_begin && this.done_fire) {
    this.end_stage();
    this.next_stage();
  }
}
Game.prototype.show_leaders = function() {
  var leader_list = localStorage.getItem('BB_Highest');
  var str = '';
  if (eader_list) {
    leader_list = USON.parse(leader_list);
    for (var i = 0; i < leader_list.length; i++) {
      str += leader_list[i].name + ' Lv.' + leader_list[i].level + ' / Score : ' + leader_list[i].score + '\n';
    }
  }
  confirm(str);
}
Game.prototype.set_highest_score = function() {
  var leader_list = localStorage.getItem('BB_Highest');
  if (!leader_list) {
    leader_list = [];
    var name = prompt('Congrats. You just set a new high record. Your Rank is #' + 1 + '\nWhat is your name?');
    var new_high = {
      name: name,
      score: this.score,
      level: this.current_level
    };
    leader_list.push(new_high);
  } else {
    var record_set = false;
    leader_list = JSON.parse(leader_list);
    for (var i = 0; i < leader_list.length; i++) {
      if (leader_list[i].score < this.score) {
        var name = prompt('Congrats. You set a new high record. Your Rank is #' + (i + 1) + '\nWhat is your name?');
        var new_high = {
          name: name,
          score: this.score,
          level: this.current_level
        };
        leader_list.splice(i, 0, new_high);
        record_set = true;
        break;
      }
    }
    if (leader_list.length >= 11) leader_list.splice(leader_list.length - 1, 1);
    else if (!record_set && leader_list.length <= 9) {
      var name = prompt('Congrats. You just set a new high record. Your Rank is #' + (leader_list.length + 1) + '\nWhat is your name?');
      var new_high = {
        name: name,
        score: this.score,
        level: this.current_level
      };
      leader_list.push(new_high);
    }
  }
  localStorage.setItem('BB_Highest', JSON.stringify(leader_list));
}
Game.prototype.next_stage = function() {
  function chk_chance(level) {
    if (level <= 100) return true;
    if (Math.random() * 100 <= (100 - 50 * (1 - Math.exp(-level / 150)))) return true;
    return false;
  }
  // Swipe Bonus
  if (this.brick_list.length == 4 && this.current_level != 0) {
    this.add_popup('Swipe Bonus :: +1 Ball', 1000);
    this.total_balls++;
  }
  // Shift entire bricks to downward
  for (var i = 4; i < this.brick_list.length; i++) {
    this.brick_list[i].y += this.brick_list[i].h;
    if (this.brick_list[i].y + this.brick_list[i].h == this.brick_list[3].y) {
      cv_world.onclick = null
      cv_world.onmousemove = null
      this.is_game_over = true;
    }
  }
  if (this.is_game_over) {
    this.set_highest_score();
    console.log('Game Over');
    return;
  }
  // Now we randomly position the new blocks
  var num = Math.floor(Math.random () * 3 + 2);
  var total = [];
  for (var i = 0; i < this.num_brick_w; i++) total.push(i);
  var chosen = [];
  for (var i = 0; i < num; i++) {
    var lucky = Math.floor(Math.random() * total.length);
    chosen.push(total[lucky]);
    total.splice(lucky, 1);
  }
  // For every 10 levels, we put red bricks which needs 2 times of normal collision count
  if (this.current_level >= 10 && this.current_level % 10 == 0) {
    var lucky = Math.floor(Math.random() * total.length);
    this.add_brick(this.brick_width * total[lucky], 0, this.brick_width, this.brick_height, 2 * (this.current_level + 1), 'boss', 'red');
    this.add_polygon(this.brick_width * total[lucky], 0, this.brick_width, this.brick_height);

  }

  // For every 10 levels (after lv. 100), we put sticky brick which eats all the balls that bounces
  // off from the brick
  if (this.current_level >= 100 && this.current_level % 10 == 5) {
    var lucky = Math.floor(Math.random() * total.length);
    this.add_brick(this.brick_width * total[lucky], 0, this.brick_width, this.brick_height, Math.floor((this.current_level + 1) / 2), 'sticky', 'yellow');
    this.add_polygon(this.brick_width * total[lucky], 0, this.brick_width, this.brick_height);

  }
  if (this.current_level >= 150 && this.current_level % 10 == 7) {
    var lucky = Math.floor(Math.random() * total.length);
    this.add_brick(this.brick_width * total[lucky], 0, this.brick_width, this.brick_height, this.current_level + 1, 'random_reflex', 'pink');
    this.add_polygon(this.brick_width * total[lucky], 0, this.brick_width, this.brick_height);
  }

  var add_ball_brick = Math.floor(Math.random() * chosen.length);
  for (var i = 0; i < chosen.length; i++) {
    if (i == add_ball_brick && chk_chance(this.current_level)) {
      this.add_brick(this.brick_width * chosen[i], 0, this.brick_width, this.brick_height, this.current_level + 1, 'add_ball', 'green');
    } else {
      this.add_brick(this.brick_width * chosen[i], 0, this.brick_width, this.brick_height, this.current_level + 1);
    }
    this.add_polygon(this.brick_width * chosen[i], 0, this.brick_width, this.brick_height);
  }
  this.add_popup('Level : ' + (this.current_level + 1), 500);
  this.stage_first_hit = true;
  this.user_select_path = null;

  cv_world.onclick = this.user_click.bind(this);
  cv_world.onmousemove = this.user_mouse.bind(this);
}

Game.prototype.test = function() {
  this.add_brick(this.brick_width * 0, this.brick_height * 2, this.brick_width, this.brick_height, 1, 'boss', 'red');
  this.add_polygon(this.brick_width * 0, this.brick_height * 2, this.brick_width, this.brick_height, 100);
  //this.add_brick(this.brick_width * 4, this.brick_height * 1 , this.brick_width, this.brick_height, 100);
  //this.add_polygon(this.brick_width * 4, this.brick_height * 1, this.brick_width, this.brick_height, 100);
  this.last_ball_x = 212.396396396
  this.total_balls = 10
  this.test_mode_enable = true;
}

Game.prototype.end_stage = function() {
  this.current_level += 1;
  this.stage_begin = false;
}
Game.prototype.fire = function(at, angle, num, fired) {
  if (!fired) fired = 0;
  this.done_fire = false;
  console.log('Fire'	+ fired);
  if (fired < num) {
    this.add_ball(at, this.brick_list[3].y, 3, 300 / 1000, {
      x: Math.cos(angle),
      y: Math.sin(angle)
    });
    this.stage_begin = true;
    var interval = num > 100 ? 30 : 100;
    setTimeout(this.fire.bind(this), interval, at, angle, num, fired + 1);
  } else {
    this.done_fire = true;
    return
  };
}
Game.prototype.user_mouse = function(e) {
  var angle;
  if (e.offsetX == this.last_ball_x) {
    angle = Math.PI / 2;
  } else {
    var grad = -(e.offsetY - this.brick_list[3].y) / (e.offsetX - this.last_ball_x);
    angle = Math.atan(grad);
    if (angle < 0) angle += Math.PI;
  }
  if (angle / (Math.PI * 2) * 360 >= 170 || angle / (Math.PI * 2) * 360 <= 10) this.angle_good = false;
  else this.angle_good = true;

  var path = new Path2D();
  path.moveTo(this.last_ball_x, this.brick_list[3].y);
  path.lineTo(e.offsetX, e.offsetY);

  this.user_select_path = path;

  world.setLineDash([5, 5]);
  if (this.angle_good) world.strokeStyle = 'blue';
  else world.strokeStyle = 'red';
  if (!this.is_game_over) world.stroke(path);
  world.setLineDash([]);
}
Game.prototype.user_click = function(e) {
  var angle;
  if (e.offsetX == this.last_ball_x) {
    angle = Math.PI / 2;
  } else {
    var grad = -(e.offsetY - this.brick_list[3].y) / (e.offsetX - this.last_ball_x);
    angle = Math.atan(grad);
    if (angle < 0) angle += Math.PI;
  }
  if (angle / (Math.PI * 2) * 360 >= 170 || angle / (Math.PI * 2) * 360 <= 10) return;
  this.fire(this.last_ball_x, -angle, this.total_balls);
  console.log('angle :: ' + angle / (Math.PI * 2) * 360);

  if (!this.test_mode_enable) {
    cv_world.onclick = null
    cv_world.onmousemove = null

    this.stage_begin = true;
  }
}
var cls = true
Game.prototype.draw = function() {
  if (cls) {
    world.fillStyle = 'white';
    world.fillRect(0, 0, this.brick_width * 10 + 100, this.brick_height * 10 + 100);
  }
  stat_level.textContent = 'Level : ' + (this.current_level + 1) + ' // Num Balls : '  + this.total_balls +  ' // Score : ' + this.score;
  world.strokeStyle = 'black';
  world.strokeRect(0, 0, this.brick_width * this.num_brick_w, this.brick_height * this.num_brick_h);
  if (!this.stage_begin && this.user_select_path && !this.is_game_over) {
    if (this.angle_good) world.strokeStyle = 'blue';
    else world.strokeStyle = 'red';
    world.setLineDash([5, 5]);
    world.stroke(this.user_select_path);
    world.setLineDash([]);
  }
  // Brick #0 ~ #3 is a Background Box
  for (var i = 4; i < this.brick_list.length; i++) this.brick_list[i].draw();
  for (var i = 0; i < this.ball_list.length; i++) this.ball_list[i].draw();
  if (this.is_game_over) {
    world.fillStyle = 'red';
    world.font = '12px Consolas';
    world.fillText('Game Over', this.brick_width * this.num_brick_w / 2 - 30, this.brick_height * this.num_brick_h / 2);
  }
  var print_line = 1;
  for (var i = 0; i < this.pop_up_text_arr.length; i++) {
    var pop_up = this.pop_up_text_arr[i];
    if (pop_up.time < Date.now()) {
      this.pop_up_text_arr.splice(i, 1);
      i
      continue;
    }
    var str_len = world.measureText(pop_up.s).width;
    var loc_x = (this.brick_width * this.num_brick_w - str_len) / 2
    world.fillStyle = 'black';
    world.font = '12px Consolas';
    world.fillText(pop_up.s, loc_x, this.brick_height * this.num_brick_h / 2 + print_line * 10);
    print_line++;
  }
}
Game.prototype.begin = function() {
  var leader = JSON.parse(localStorage.getItem('BB_Highest'));
  if(leader) leader_board.textContent = 'Highest :: ' + leader[0].name + ' Lv.' + leader[0].level + ' / Score : ' + leader[0].score;
  this.prev_draw_stamp = Date.now();
  requestAnimationFrame(this.each_frame.bind(this))
  this.stage_begin = false;
  this.next_stage();
}
Game.prototype.each_frame = function() {
  this.tick(Date.now() - this.prev_draw_stamp);
  this.draw();
  this.prev_draw_stamp = Date.now();
  if (!this.is_game_over) requestAnimationFrame(this.each_frame.bind(this));
}
var game = new Game();
game.begin();
show_leaders.onclick = game.show_leaders.bind(game);
show_help.onclick = function() {
  var s = 'Help!'

    confirm(s);
}
force_end.onclick = function() { game.red_flag = true; }
