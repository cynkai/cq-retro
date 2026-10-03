class Greeter:
    def __init__(self, name):
        self.name = name

    def hello(self):
        return f"Hello, {self.name}"


def top_level(x):
    return x + 1

