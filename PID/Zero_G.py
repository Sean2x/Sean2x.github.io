import tkinter as tk
import math
import time


window = tk.Tk()
window.title("Zero-G Flight Simulator")

# =========================
# RESET SIMULATION

def reset_simulation():

    global ball_x
    global ball_y
    global point_index

    global x_speed
    global y_speed
    global velocity
    global angle
    global elevation

    global previous_y_speed
    global vertical_acceleration
    global g_force

    # Reset ball position
    point_index = 0
    ball_x, ball_y = points[0]

    # Reset physics
    x_speed = 0
    y_speed = 0
    velocity = 0
    angle = 0
    elevation = 400 - ball_y

    previous_y_speed = 0
    vertical_acceleration = 0
    g_force = 1

    # Move ball visually
    canvas.coords(
        ball,
        ball_x - 10,
        ball_y - 10,
        ball_x + 10,
        ball_y + 10
    )
    
# =========================
# CANVAS

canvas = tk.Canvas(
    window,
    width=800,
    height=500,
    bg="black"
)
canvas.pack()


# Ground
canvas.create_line(
    50, 400,
    750, 400,
    fill="brown",
    width=2
)


# =========================
# TRAJECTORY EQUATION

def trajectory(x):
    return (100 * math.exp(-((x - 400) ** 2) / (2 * 100 ** 2)) + 100)
    # return -0.002 * (x - 400)**2 + 250


# Create trajectory points
points = []

for x in range(50, 751, 2):

    y = trajectory(x)

    # Flip Y because Tkinter's Y axis points downward
    canvas_y = 400 - y

    points.append((x, canvas_y))


# =========================
# DRAW TRAJECTORY

draw_points = []

for x, y in points:
    draw_points.extend([x, y])


canvas.create_line(
    draw_points,
    fill="#b5179e",
    width=3,
    smooth=True
)


# =========================
# Plane




# Ball position
ball_x, ball_y = points[0]

airplane_image = tk.PhotoImage(file="Sean2x.github.io\\PID\\airplane.png")

airplane = canvas.create_image(
    ball_x,
    ball_y,
    image=airplane_image
)

# Movement speed
speed = 1

# Current trajectory point
point_index = 0


# =========================
# PHYSICS VARIABLES

x_speed = 0
y_speed = 0
velocity = 0
angle = 0
elevation = 0

previous_y_speed = 0

# Time between simulation updates
dt = 0.016

vertical_acceleration = 0


# =========================
# INFO

info = tk.Label(
    window,
    text=(
        "FLIGHT DATA\n\n"
        "Elevation:     0 ft\n"
        "X Speed:       0 mph\n"
        "Y Speed:       0 mph\n"
        "Speed:         0 mph\n"
        "Angle:         0°\n"
        "Vertical Accel: 0 ft/s²\n"
        "G-Force:       0.00 G"
    ),
    bg="black",
    fg="white",
    font=("Consolas", 14),
    justify="left"
)

info.pack(pady=10)


# =========================
# BALL MOVEMENT

def move_ball():

    global ball_x
    global ball_y
    global point_index

    global x_speed
    global y_speed
    global velocity
    global angle
    global elevation

    global previous_y_speed
    global vertical_acceleration
    global g_force


    # =========================
    # END OF TRAJECTORY

    if point_index >= len(points) - 1:
        reset_simulation()

        window.after(
            16,
            move_ball
        )

        return


    # =========================
    # NEXT POINT

    target_x, target_y = points[point_index + 1]


    # Direction from ball to next point
    dx = target_x - ball_x
    dy = target_y - ball_y


    # Distance to next point
    distance = math.sqrt(
        dx**2 + dy**2
    )


    # =========================
    # MOVE BALL

    if distance <= speed:

        ball_x = target_x
        ball_y = target_y

        point_index += 1

    else:

        # Normalize direction
        dx /= distance
        dy /= distance

        # Move ball
        ball_x += dx * speed
        ball_y += dy * speed


    # =========================
    # DRAW BALL

    canvas.coords(
    airplane,
    ball_x,
    ball_y
    )


    # =========================
    # FLIGHT DATA

    if point_index < len(points) - 2:

        next_x, next_y = points[point_index + 1]
        future_x, future_y = points[point_index + 2]


        # Direction vector
        dx = future_x - next_x
        dy = future_y - next_y


        # Distance between trajectory points
        distance = math.sqrt(
            dx**2 + dy**2
        )


        # Normalize
        unit_x = dx / distance
        unit_y = dy / distance


        # =========================
        # VELOCITY

        x_speed = unit_x * speed

        # Negative because Tkinter Y increases downward
        y_speed = -unit_y * speed


        # =========================
        # TOTAL SPEED

        velocity = math.sqrt(
            x_speed**2 +
            y_speed**2
        )


        # =========================
        # FLIGHT ANGLE

        angle = math.degrees(
            math.atan2(
                y_speed,
                x_speed
            )
        )


        if y_speed != previous_y_speed:

            vertical_acceleration = (
                y_speed - previous_y_speed
            ) / dt

            previous_y_speed = y_speed

            # Update G-force only when acceleration changes
            g_force = vertical_acceleration + 1


    # =========================
    # ELEVATION

    elevation = 400 - ball_y


  
    


    # =========================
    # UPDATE DISPLAY

    info.config(
        text=(
            "FLIGHT DATA\n\n"

            f"Elevation:       "
            f"{elevation:6.1f} ft\n"

            f"X Speed:         "
            f"{x_speed:6.2f} mph\n"

            f"Y Speed:         "
            f"{y_speed:6.2f} mph\n"

            f"Speed:           "
            f"{velocity:6.2f} mph\n"

            f"Angle:           "
            f"{angle:6.1f}°\n"

            f"Vertical Accel:  "
            f"{vertical_acceleration:6.2f} ft/s²\n"

            f"G-Force:         "
            f"{g_force:6.2f} G"
        )
    )


    # =========================
    # RUN AGAIN

    window.after(
        16,
        move_ball
    )


# =========================
# START

move_ball()

window.mainloop()