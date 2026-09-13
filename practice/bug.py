# Программа считает средний балл каждого ученика и находит лучшего.
# В ней три ошибки. Запусти программу, найди и исправь их.
# Правильный вывод:
#   Аня средний балл: 4.67
#   Борис средний балл: 3.67
#   Вера средний балл: 5.0
#   Лучший ученик: Вера

grades = {
    "Аня": [5, 4, 5],
    "Борис": [3, 4, 4],
    "Вера": [5, 5, 5],
}


def average(marks):
    total = 0
    for m in marks:
        total = m
    return round(total / len(marks), 2)


best_name = ""
best_avg = 0
for name in grades:
    avg = average(grades[name])
    print(name, "средний балл:", avg)
    if avg < best_avg:
        best_avg = avg
        best_name = name

print("Лучший ученик:" best_name)
