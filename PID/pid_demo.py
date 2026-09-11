
# =========================
# IMPORTS

from dbm import error
import tkinter as tk

# =========================
# WINDOW SETTINGS

window = tk.Tk()
window.title("My First Simulator")

# =========================
# Methods

def toggle_pause():
    global pause_simulation
    pause_simulation = not pause_simulation
    if not pause_simulation:
        pause_button.config(text="Resume")
    else:
        pause_button.config(text="Pause")

def update_sliders(value):
    global kp, ki, kd, dampening, target_y

    
    kp = KP.get()
    ki = KI.get()
    kd = KD.get()
    dampening = Dampening.get()

def start_simulation():
    global x, velocity, acceleration, previous_x, previous_y, kp, dampening, ki, kd, integral, previous_error, frame, target_y
    
    Target.delete(0, "end")
    Target.insert(0, target_y)
    KP.set(kp)
    KI.set(ki)
    KD.set(kd)
    Dampening.set(dampening)

    move()


def reset_simulation():
    global x, velocity, acceleration, previous_x, previous_y, kp, ki, kd, dampening, integral, previous_error, frame

    velocity = 0
    acceleration = 0
    
    integral = 0
    previous_error = 0
    
    frame = 0


    previous_x = start_pos[0]
    previous_y = start_pos[1]


    canvas.coords(
        dot, 
        start_pos[0] - ball_radius, start_pos[1] - ball_radius,
        start_pos[0] + ball_radius, start_pos[1] + ball_radius)
    canvas.delete("trail")



# =========================
# GUI

# Create drawing area
canvas = tk.Canvas(
    window, 
    width=1600, 
    height=400,


    )


info = tk.Label(
    window,
    text="INFO\n\nPosition: 0\nVelocity: 0\nAcceleration: 0\n Integral: 0\n Output: 0",
    font=("Arial", 14),
    justify="left",
    width=70,
    anchor="w",
    bg="white",
    fg="black"
    
)

KP = tk.Scale(
    window,
    from_=0,
    to=1,
    resolution=0.01,
    orient="horizontal",
    label="Kp",
    command=update_sliders
)

KI = tk.Scale(
    window,
    from_=0,
    to=1,
    resolution=0.01,
    orient="horizontal",
    label="Ki",
    command=update_sliders
)

KD = tk.Scale(
    window,
    from_=0,
    to=1,
    resolution=0.01,
    orient="horizontal",
    label="Kd",
    command=update_sliders
)


KP = tk.Scale(
    window,
    from_=0,
    to=1,
    resolution=0.01,
    orient="horizontal",
    label="Kp",
    command=update_sliders
)

Dampening = tk.Scale(
    window,
    from_=.5,
    to=1,
    resolution=0.01,
    orient="horizontal",
    label="Dampening Coeff",
    command=update_sliders
)

Target = tk.Spinbox(
    window,
    from_=0,
    to=400,
    increment=50,
    command=update_sliders,
)

reset_button = tk.Button(
    window,
    text="Reset",
    command=reset_simulation
)

pause_button = tk.Button(
    window,
    text="Pause",
    command=toggle_pause
)


canvas.pack(fill="x")

Target.pack(fill="x")
KP.pack(fill="x")
KI.pack(fill="x")
KD.pack(fill="x")
Dampening.pack(fill="x")

info.pack(fill="x")

reset_button.pack()
pause_button.pack()


# =========================
# VARIABLES

target_y = 200  # y-coordinate of the line

start_pos = [50, 400]
ball_radius = 10

previous_x = start_pos[0]
previous_y = start_pos[1]

dt = .05

velocity = 0
acceleration = 0
frame = 0
dampening = 0.99
pause_simulation = True


# =========================
# SIMULATION OBJECTS

# Create a target
target = canvas.create_line(
    0, target_y,
    10000, target_y,
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

kp = 0.2
ki = .03
kd = .04

integral = 0
previous_error = 0

# =========================
# SIMULATION

def move():
    global x, dy, frame, acceleration, velocity, integral, previous_error
    global previous_x, previous_y, target_y, kp, ki, kd, dampening


    if pause_simulation == True:

        frame += 1
        
        # -------------------------
        # READ TARGER
        # -------------------------
        target_y = 400 -float(Target.get())
        
        canvas.coords(
            target,
            0, target_y,
            10000, target_y
        )
        
        # -------------------------
        # READ POSITION
        # -------------------------
        position = canvas.coords(dot)               # Sensor
        x = (position[0] + position[2]) / 2
        y = (position[1] + position[3]) / 2
        
        
        
        # -------------------------
        # PID
        # -------------------------
        error = target_y - y
        
        # P
        proportional = kp * error
        
        # I
        integral += error * dt
        integral_output = ki * integral
        
        # I Clamping
        
        # D
        if dt != 0 :
            derivative = (error - previous_error) / dt
        else:
            derivative = 0
            
        derivative_output = kd * derivative
        
        # PID
        
        acceleration = proportional + integral_output + derivative_output
        
        # prev error
        previous_error = error

        # -------------------------
        # PHYSICS
        # -------------------------
    
        velocity += acceleration * dt       # Propotional 
        velocity *= (dampening)                 # Damping
    
    
        # -------------------------
        # MOVE OBJECT
        # -------------------------
    
        canvas.move(dot, 1, velocity)
    
        # -------------------------
        # UPDATE DISPLAY
        # -------------------------
    
        info.config(
            text=f"INFO\n\n"
                    f"Position: {y:.2f}\n"
                    f"Velocity: {velocity:.2f}\n"
                    f"Acceleration: {acceleration:.2f}\n"
                    f"Integral: {integral:.2f} \n"
                    f"Output: {integral_output:.2f}"
        )
        
    
        if frame % 1 == 0:
            canvas.create_line(
                previous_x, previous_y,
                x, y,
                fill="red",
                width=3,
                tags="trail",
            )
    
        previous_x = x
        previous_y = y
        
        
    
        canvas.tag_raise(dot)
    
        

    window.after(10, move)

# =========================
# START PROGRAM
# =========================

start_simulation()

window.mainloop()

