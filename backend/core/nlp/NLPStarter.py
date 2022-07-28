import spacy
from spacy.matcher import Matcher
import config

nlp = spacy.load(f"{config.PROJECT_URL}/nlp/ner-pipe/training/model-best")

# The source pipeline with different components
source_nlp = spacy.load("en_core_web_trf")

# the textcat pipeline
textcat_nlp = spacy.load(f"{config.PROJECT_URL}/nlp/textcat-pipe/training/model-best")

# the mongodb textcat pipeline
mongo_textcat_nlp = spacy.load(f"{config.PROJECT_URL}/nlp/mongo-textcat-pipe/training/model-best")

nlp.add_pipe("textcat", source=textcat_nlp)

for pipe in source_nlp.pipeline:
    if(pipe[0] != "ner" and pipe[0] != "textcat"):
        nlp.add_pipe(pipe[0], source=source_nlp)

matcher = Matcher(nlp.vocab, validate=True)

# matcher for creating value queries
if(matcher.get('GREATER')):
    matcher.remove('GREATER')
if(matcher.get('LESS')):
    matcher.remove('LESS')
if(matcher.get('EQUAL')):
    matcher.remove('EQUAL')
    
# greater_than_pattern = [{'LOWER': 'greater'}, {'LOWER': 'than', 'OP' : '?'}, {'POS' : 'NUM'}]
# larger_than_pattern = [{'LOWER': 'larger'}, {'LOWER': 'than', 'OP' : '?'}, {'POS' : 'NUM'}]
# great_pattern = [[{'LOWER': 'greater'}, {'LOWER': 'than', 'OP' : '?'}, {'POS' : 'NUM'}], [{'LOWER': 'larger'}, {'LOWER': 'than', 'OP' : '?'}, {'POS' : 'NUM'}]]
# less_than_pattern = [[{'LOWER': 'less'}, {'LOWER': 'than', 'OP' : '?'}, {'POS' : 'NUM'}]]
# equal_to_pattern = [[{'LOWER': 'equal'}, {'LOWER': 'to', 'OP' : '?'}, {'POS' : 'NUM'}]]
matcher.add("GREATER", config.patterns["great_pattern"])
matcher.add("LESS", config.patterns["less_than_pattern"])
matcher.add("EQUAL", config.patterns["equal_to_pattern"])

stat_matcher = Matcher(nlp.vocab, validate=True)

if(stat_matcher.get('MIN')):
    stat_matcher.remove('MIN')
if(stat_matcher.get('MAX')):
    stat_matcher.remove('MAX')
if(stat_matcher.get('AVG')):
    stat_matcher.remove('AVG')

# min_pattern = [[{'LOWER': 'min'}], [{'LOWER': 'minimum'}], [{'LOWER': 'smallest'}]]
# max_pattern = [[{'LOWER': 'max'}], [{'LOWER': 'maximum'}], [{'LOWER': 'biggest'}]]
# avg_pattern = [[{'LOWER': 'avg'}], [{'LOWER': 'average'}], [{'LOWER': 'mean'}]]
# current_pattern =[[{'LOWER': 'current'}], [{'LOWER': 'last'}]]
stat_matcher.add("MIN", config.patterns["min_pattern"])
stat_matcher.add("MAX", config.patterns["max_pattern"])
stat_matcher.add("AVG", config.patterns["avg_pattern"])
stat_matcher.add("CUR", config.patterns["current_pattern"])