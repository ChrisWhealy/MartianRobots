# Martian Robots

A small JavaScript program that moves a series of robots around a grid.

Assumptions:

* The grid is not toroidal, but has edges. Thus robots can be lost if they move off the grid
* No two robots can occupy the same grid location
* A robot's starting position cannot be outside the grid

The program is driven by commands received from standard in.  For example:

```
5 3
1 1 E
RFRFRFRF
3 2 N
FRRFLLFFRRFLL
0 3 W
LLFFFLFLFL
```

The first line is the grid dimensions (width x height): `5 3`

Followed by `n: n > 0` pairs of lines where the first line defines the location of a new robot and its heading.

E.G. `1 1 E` places a new robot at `(1,1)` facing east

The next line is a simple set of commands consisting of:

* `F`: Move one position forwardalong the current heading
* `L`: Rotate left on the spot
* `R`: Rotate right on the spot

After obeying a sequence of instructions, the robot reports its new position to standard out.  So for an input of

```
5 3
1 1 E
RFRFRFRF
```

A 5 x 3 world is created with a robot at `(1,1)` facing east.  This robot rotates right and moves forward one position.  This is repeated 3 times and results in the robot being back where it started.  So it it reports its position as

`1 1 E`

Assuming the following input continues directly from that shown above

```
3 2 N
FRRFLLFFRRFLL
```

Would generate `3 3 N LOST` because to move north from location `(3,3)` causes the robot to drop off the edge of the world.  (And as we know, here be monsters...)

Robots only know that a move is dangerous is a previous robot died by performing the same move.  Such events should be recorded so that other robots can ignore that instruction and stay alive.

