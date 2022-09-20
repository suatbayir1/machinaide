mongo = dict(
    MONGO_URI = "mongodb://machinaide:erste2020@localhost:27017/",
    DATABASE = "machinaide"
)

influx = dict(
    orgID = 'd572bde16b31757c',
    dbtoken = "FlviKxQ-RHHWxd1FRkHIc5VwNZuFnP6QTmsJcU6GI7nrd4cuqaTx3cCijZchENMH0zSGuKOew_e4LxW6V09Erw=="
)

math = dict(
    math_symbols = ['>', '>=', '<', '<=', '=', '=='],
    math_symbol_dict = {'>': ' greater than ', 
        '>=': ' greater than or equal to ', 
        '<': ' less than ', 
        '<=': ' less than or equal to ', 
        '=': ' equal to ', 
        '==': ' equal to '
    },
    comparisons = {'GREATER': '>', 'EQUAL': '==', 'LESS': '<'},
    stats = {'MIN': 'min()', 'MAX': 'max()', 'AVG': 'mean()', 'CUR': 'last()'},
)

patterns = dict(
    great_pattern = [[{'LOWER': 'greater'}, {'LOWER': 'than', 'OP' : '?'}, {'POS' : 'NUM'}], [{'LOWER': 'larger'}, {'LOWER': 'than', 'OP' : '?'}, {'POS' : 'NUM'}]],
    less_than_pattern = [[{'LOWER': 'less'}, {'LOWER': 'than', 'OP' : '?'}, {'POS' : 'NUM'}]],
    equal_to_pattern = [[{'LOWER': 'equal'}, {'LOWER': 'to', 'OP' : '?'}, {'POS' : 'NUM'}]],
    greater_than_pattern = [{'LOWER': 'greater'}, {'LOWER': 'than', 'OP' : '?'}, {'POS' : 'NUM'}],
    larger_than_pattern = [{'LOWER': 'larger'}, {'LOWER': 'than', 'OP' : '?'}, {'POS' : 'NUM'}],
    min_pattern = [[{'LOWER': 'min'}], [{'LOWER': 'minimum'}], [{'LOWER': 'smallest'}]],
    max_pattern = [[{'LOWER': 'max'}], [{'LOWER': 'maximum'}], [{'LOWER': 'biggest'}]],
    avg_pattern = [[{'LOWER': 'avg'}], [{'LOWER': 'average'}], [{'LOWER': 'mean'}]],
    current_pattern =[[{'LOWER': 'current'}], [{'LOWER': 'last'}]],
)

parts = dict(
    COMP_NAMES = ["yaglama", "anaMotor", "dengeleme", "compName", "sampleComp1", "sampleComp2", "cpu", "diskio"],
    all_maintenance_types = ["Maintenance 1", "Maintenance 2", "Maintenance 3"],
    all_severity_types = ["acceptable", "major", "critical"],
)

constants = dict(
    threshold = 85
)
