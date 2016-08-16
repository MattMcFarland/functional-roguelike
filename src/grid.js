const chance = require('chance')
const assert = require('assert')

function randPlus (low, high) {
  return Math.floor((Math.random() * (high - low)) + low)
}

/* n -> grid */
const emptyGrid = (size) => {
  assert(size && size > 2)
  const grid = []
  for (var x = 0; x < size; x++) {
    grid[x] = []
    for (var y = 0; y < size; y++) {
      grid[x][y] = '#'
    }
  }
  grid.size = size
  return grid
}

const createRoomsFromTree = (tree) => {
  return Object.keys(tree).reduce((acc, key) => {
    const node = tree[key]
    if (node.w) {
      let room = {};
      room.w = randPlus(tree.minRoomSize, node.w);
      room.h = randPlus(tree.minRoomSize, node.h);
      room.x = node.x + Math.floor((node.w - room.w) / 2);
      room.y = node.y + Math.floor((node.h - room.h) / 2);

      room.center = {};
      room.center.x = Math.floor(room.x + room.w / 2);
      room.center.y = Math.floor(room.y + room.h / 2);

      room.id = key;
      tree[key].hasRoom = key
      acc.push(room)
    }
    return acc
  }, [])
}

const assignRoomsToGrid = (grid, rooms) => {
  rooms.forEach((r) => {
      console.log("Room: ", [r.x, r.y, r.w, r.h]);
      for (var x = r.x; x < (r.x + r.w); x++) {
          for (var y = r.y; y < (r.y + r.h); y++) {
              grid[x][y] = '.';
          }
      }
  })
  return grid
}

/* (x, y, w, h) -> node */
const createNode = (x, y, w, h, alignment) => Object.assign({}, ({
  x, y, w, h,
  alignment,
  center: {
    x: Math.floor(x + w / 2),
    y: Math.floor(y + h / 2)
  }
}))

const initializeTree = ({ size, minSizeFactor, minRoomSize }) => {
  const tree = {
    stack: [],
    size,
    minSizeFactor,
    minRoomSize
  }
  let gid = 1

  tree[1] = createNode(1, 1, size - 2, size - 2, 'top')

  return function (root = 1) {
    let { x: X, y: Y, w: W, h: H } = tree[root]
    let { box1, box2 } = ({}, {})

    var ok = 0
    // Select a split - Horizontal((0) or Vertical(1)
    // This allows you to have a valid splitType oppurtunity
    var splitType = 1
    if (minSizeFactor * W < minRoomSize) {
      // no space for splitting vertically, try Horizontal
      splitType = 0
    } else if (minSizeFactor * H < minRoomSize) {
      // no space for splitting vertically, try Vertical
      splitType = 1
    } else {
      // random - Both H and V are valid splits
      if (Math.random() > 0.5) {
        splitType = 0
      }
    }

    // generate 2 boxes (child nodes)
    // Ensure minimum size - else quit producing new boxes
    if (splitType) {
      let roomSize = minSizeFactor * W
      if (roomSize >= minRoomSize) {
        let w1 = randPlus(roomSize, (W - roomSize))
        let w2 = W - w1
        box1 = createNode(X, Y, w1, H, 'V')
        box2 = createNode(X + w1, Y, w2, H, 'V')

        ok++
      }
    } else {
      roomSize = minSizeFactor * H
      if (roomSize >= minRoomSize) {
        let h1 = randPlus(roomSize, (H - roomSize))
        let h2 = H - h1
        box1 = createNode(X, Y, W, h1, 'H')
        box2 = createNode(X, Y + h1, W, h2, 'V')

        ok++
      }
    }

    if (ok) {
      tree[gid] = box1
      tree[root].L = gid
      gid++

      tree[gid] = box2
      tree[root].R = gid
      gid++

      tree.stack.push([tree[root].L, tree[root].R])

      buildTree(tree[root].L)
      buildTree(tree[root].R)
    }
    return tree
  }
}

const joinRooms = (tree, grid) => {
  var join;
  while (join = tree.stack.pop()) {
      var a = join[0];
      var b = join[1];
      console.log("join: "+[a,b]+" split: "+tree[a].alignment);
      var x = Math.min(tree[a].center.x, tree[b].center.x);
      var y = Math.min(tree[a].center.y, tree[b].center.y);
      var size = randPlus(1, tree.minRoomSize);
      var w = size;
      var h = size;
      // Vertical corridor
      if (tree[a].alignment == 'H') {
          x -= Math.floor(size / 2) + 1;
          h = Math.abs(tree[a].center.y - tree[b].center.y);
      } else {
          // Horizontal corridor
          y -= Math.floor(size / 2) + 1;
          w = Math.abs(tree[a].center.x - tree[b].center.x);
      }

      // Ensure Legal bounds
      x = x < 0 ? 0 : x;
      y = y < 0 ? 0 : y;

      console.log("Corridor: " + [x, y, w, h]);
      for (var i = x; i < x + w; i++) {
          for (var j = y; j < y + h; j++) {
              if (grid[i][j] === '#') grid[i][j] = '_';
          }
      }
  }
}

const size = 33
const minSizeFactor = 0.2
const minRoomSize = 2

const buildTree = initializeTree({size, minSizeFactor, minRoomSize})
const tree = buildTree()
const rooms = createRoomsFromTree(tree)
const grid = assignRoomsToGrid(emptyGrid(size), rooms)
joinRooms(tree, grid)

console.log("DUNGEON");
for (var x = 0; x < size; x++) {
    var row = x;

    if (x < 10) {
        row += ' ';
    } else {
        row += '';
    }

    for (var y = 0; y < size; y++) {
        row += grid[x][y] + ' ';
    }
    console.log(row);
}