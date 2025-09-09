import importlib

def load_libs(libs):
    modules = {}
    for lib in libs:
        modules[lib] = importlib.import_module(lib)
    return modules
