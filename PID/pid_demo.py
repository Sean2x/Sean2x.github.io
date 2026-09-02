import tkinter as tk
from turtle import position

# Create window
window = tk.Tk()
window.title("My First Simulator")

# Create drawing area
canvas = tk.Canvas(window, width=800, height=400)
canvas.pack()

line_y = 200  # y-coordinate of the line

# Create a target
target = canvas.create_line(
    0, line_y,
    800, line_y,
    dash=(1, 90)
)

start_pos = [50, 400]
ball_radius = 10

# Create a dot
dot = canvas.create_oval(
    start_pos[0] - ball_radius, start_pos[1] - ball_radius,
    start_pos[0] + ball_radius, start_pos[1] + ball_radius,
    fill="blue"
)



kp = 0.31  # Proportional gain

dy = 0

frame = 0


# Move the dot
def move():
    global dy, frame

    frame += 1

    position = canvas.coords(dot)               # Sensor
    x = (position[0] + position[2]) / 2
    y = (position[1] + position[3]) / 2

    error = line_y - y                          # Error

    acceleration = kp * error                   # Proportional
    dy += acceleration * 0.05





    


    dy *= 0.98                                  # Plant


    canvas.move(dot, 1, dy)
   

    if frame % 1 == 0:
        canvas.create_oval(
            x - 2, y - 2,
            x + 2, y + 2,
            fill="red",
            outline="red"
        )

    canvas.tag_raise(dot)

    window.after(10, move)

# Start moving
move()

# Keep window running
window.mainloop()