
# =========================
# IMPORTS

import tkinter as tk

# =========================
# WINDOW SETTINGS

window = tk.Tk()
window.title("My First Simulator")

# =========================
# GUI

# Create drawing area
canvas = tk.Canvas(
    window, 
    width=800, 
    height=400,


    )


info = tk.Label(
    window,
    text="INFO\n\nPosition: 0\nVelocity: 0\nAcceleration: 0",
    font=("Arial", 14),
    justify="left",
    width=70,
    anchor="w",
    bg="black",
    fg="#b5179e"
    
)

slider = tk.Scale(
    window,
    from_=0,
    to=10,
    orient="horizontal"
)

canvas.pack(fill="x")
slider.pack(fill="x")
info.pack(fill="x")


# =========================
# VARIABLES

line_y = 200  # y-coordinate of the line

start_pos = [50, 400]
ball_radius = 10

previous_x = start_pos[0]
previous_y = start_pos[1]

kp = 0.31  # Proportional gain

dy = 0
acceleration = 0
frame = 0


# =========================
# SIMULATION OBJECTS

# Create a target
target = canvas.create_line(
    0, line_y,
    800, line_y,
    dash=(1, 90)
)

# Create a dot
dot = canvas.create_oval(
    start_pos[0] - ball_radius, start_pos[1] - ball_radius,
    start_pos[0] + ball_radius, start_pos[1] + ball_radius,
    fill="blue"
)

# =========================
# PID
# =========================

kp = 0.31
ki = 0
kd = 0

# =========================
# SIMULATION

def move():
    global dy, frame, acceleration
    global previous_x, previous_y

    frame += 1

    # -------------------------
    # READ POSITION
    # -------------------------
    position = canvas.coords(dot)               # Sensor
    x = (position[0] + position[2]) / 2
    y = (position[1] + position[3]) / 2

    # -------------------------
    # PID
    # -------------------------
    error = line_y - y
    acceleration = kp * error

    # -------------------------
    # PHYSICS
    # -------------------------

    dy += acceleration * 0.05       # Propotional
    dy *= 0.95                      # Damping


    # -------------------------
    # MOVE OBJECT
    # -------------------------

    canvas.move(dot, 1, dy)

    # -------------------------
    # UPDATE DISPLAY
    # -------------------------

    info.config(
        text=f"INFO\n\n"
             f"Position: {y:.2f}\n"
             f"Velocity: {dy:.2f}\n"
             f"Acceleration: {acceleration:.2f}"
    )
   

    if frame % 1 == 0:
        canvas.create_line(
            previous_x, previous_y,
            x, y,
            fill="red",
            width=3
        )

    previous_x = x
    previous_y = y

    canvas.tag_raise(dot)

    window.after(10, move)

# =========================
# START PROGRAM
# =========================

move()

window.mainloop()