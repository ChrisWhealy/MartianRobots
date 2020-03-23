'use strict'

process.stdin.resume()
process.stdin.setEncoding('utf-8')

const TRACE_ACTIVE = false

const doTraceFn =
  traceActive =>
    traceActive ? traceMsg => console.log(traceMsg)
                : () => {}

const trace = doTraceFn(TRACE_ACTIVE)

// *********************************************************************************************************************
class Location {
  constructor(xArg, yArg) {
    // id of -1 indicates that this location is not currently occupied
    this.id            = -1
    this.x             = xArg
    this.y             = yArg
    this.hereBeDragons = ""
  }
}

class Robot {
  // Robot ids are stored in the location object currently occupied by the robot
  constructor(idArg, xArg, yArg, hdgArg) {
    this.id      = idArg
    this.x       = xArg
    this.y       = yArg
    this.heading = hdgArg
    this.history = []
    this.isLost  = false
  }
}

// *********************************************************************************************************************
// On the spot rotation by 90 degrees
const headingsRight = ["N", "E", "S", "W"]
const headingsLeft  = ["N", "W", "S", "E"]

const turn =
  headingsList =>
    heading =>
      headingsList[(headingsList.indexOf(heading) + 1) % 4]

const turnRight =
  hdg => {
    let newHdg = turn(headingsRight)(hdg)
    trace(`Turning right. New heading is ${newHdg}`)
    return newHdg
  }

const turnLeft =
  hdg => {
    let newHdg = turn(headingsLeft)(hdg)
    trace(`Turning left. New heading is ${newHdg}`)
    return newHdg
  }

// *********************************************************************************************************************
// Move forwards one position
const move =
  robot => {
    let currentLoc = getLocation(robot.x, robot.y)
    let newX = robot.x
    let newY = robot.y

    // Don't bother calculating new position if a previous robot has died by going in that direction...
    if (currentLoc.hereBeDragons.indexOf(robot.heading) === -1) {
      // It seems safe to proceed, so what would our new location be if we obeyed this instruction?
      switch (robot.heading) {
        case "N": newY = robot.y + 1; break
        case "E": newX = robot.x + 1; break
        case "S": newY = robot.y - 1; break
        case "W": newX = robot.x - 1; break
        
        default:
      }

      // What would our new location be
      let newLoc = getLocation(newX, newY)

      // Are we about to drop off the edge of the world?
      if (isValidLocation(newX, newY)) {
        // Nope, so is the new location already occupied?
        if (newLoc.id === -1) {
          // Nope, so update both the world and the robot position
          currentLoc.id = -1
          newLoc.id = robot.id
          robot.x = newX
          robot.y = newY
        }
        else {
          console.error(`Unable to move to location (${newX}, ${newY}) - already occupied`)
        }
      }
      else {
        // Yikes - Here be dragons!
        currentLoc.hereBeDragons += robot.heading
        robot.isLost = true
      }
    }
    else {
      trace(`Ignoring instruction to move to (${newX}, ${newY}) due to certain death`)
    }

    trace(`Location after move is (${robot.x}, ${robot.y})`)
    return robot
  }

// *********************************************************************************************************************
let isValidLocation = () => {}
let world           = []
let robots          = []
let lineCount       = 0
let robotId         = 0
let x               = -1
let y               = -1
let heading         = ""

// *********************************************************************************************************************
// Inclusive numeric range test
const isBetween = (lower, upper, val) => val >= lower && val <= upper

// Boundary test
const isInsideRectangle =
  (bottom_left_x, bottom_left_y, top_right_x, top_right_y) =>
    (x,y) =>
      isBetween(bottom_left_x, top_right_x, x) &&
      isBetween(bottom_left_y, top_right_y, y)

// *********************************************************************************************************************
// Returns the object at world location (x,y)
const getLocation =
  (x,y) => {
    if (world[y]    === undefined) world[y]    = [] 
    if (world[y][x] === undefined) world[y][x] = new Location(x,y)

    return world[y][x]
  }

// Is there already a robot at this location
const isVacant = (x,y) => getLocation(x,y).id === -1

// Create a new robot and arbitrarily place it into the given location
const placeNewRobotAt =
  (id,x,y,heading) => {
    robots[id] = new Robot(id,x,y,heading)
    getLocation(x,y).id = id
  }

// *********************************************************************************************************************
// Can I haz data pleez?
// *********************************************************************************************************************
process.stdin.on('data', stdIn => {
  // Arbitrarily strip trailing whitespace which might result in an empty line
  let lineData = stdIn.replace(/\s*$/, "")

  // Perform minimal input validation - Ignore zero length lines
  if (lineData.length > 0) {
    // Even numbered lines contain movement instruction sets
    if (lineCount % 2 === 0) {
      // Line zero is the special case holding the world dimensions
      if (lineCount === 0) {
        // Extract world dimensions and generate boundary test function
        // World dimensions are assumed to be exclusive
        let [width, height] = lineData.split(" ").map(Number)
        isValidLocation = isInsideRectangle(0, 0, width, height)
        trace(`World dimensions = [${width},${height}]`)
      }
      else {
        let instructionSet = lineData.toUpperCase()
        trace(`Instruction set = ${instructionSet}`)

        // Move robot according to instruction set
        let thisRobot = robots[getLocation(x,y).id]

        for (let i=0; i<instructionSet.length; i++) {
          thisRobot.history += instructionSet[i]

          switch(instructionSet[i]) {
            // Turn right
            case "R":
              thisRobot.heading = turnRight(thisRobot.heading)
              break

            // Turn left
            case "L":
              thisRobot.heading = turnLeft(thisRobot.heading)
              break

            // Forwards
            case "F":
              thisRobot = move(thisRobot)
              break
            
            // Other commands can be implemented here
            default:
          }

          // Did we just die?
          if (thisRobot.isLost) {
            trace(`Robot id ${thisRobot.id} died!`)
            thisRobot.history += " LOST"
            i = instructionSet.length
          }
        }

        // Output new robot location and heading
        console.log(`${thisRobot.x} ${thisRobot.y} ${thisRobot.heading}${thisRobot.isLost ? " LOST" : ""}`)
      }
    }
    // Odd numbered lines contain the robot's (x,y) grid location and the heading
    else {
      [x, y, heading] = lineData.split(" ").map((val,idx) => idx < 2 ? parseInt(val) : val.toUpperCase())
      
      // Is the new robot's location valid?
      if (isValidLocation(x,y)) {
        // Is the new robot's location still vacant?
        if (isVacant(x,y)) {
          trace(`Placing robot ${robotId} at (${x},${y}) heading ${heading}`)
          placeNewRobotAt(robotId++, x, y, heading)
        }
        else {
          console.error(`Can't place a new robot at (${x},${y}) - location already occupied`)
        }
      }
      else {
        console.error(`New robot location (${x},${y}) lies outside world boundaries`)
      }
    }

    lineCount++
  }
})

// KTHXBAI
process.stdin.on('end', _ => trace("\n"))


