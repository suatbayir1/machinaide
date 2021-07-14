import config
from spellchecker import SpellChecker
from fuzzywuzzy import process

class QuestionCorrector():
    def __init__(self):
        self.spell = SpellChecker()

    def math_symbol_converter(self, question):
        for symbol in config.math["math_symbols"]:
            if(symbol in question):
                question = question.replace(symbol, config.math["math_symbol_dict"][symbol])
        
        return question

    def misspell_corrector(self, question):
        question = question.split()
        misspelled = self.spell.unknown(question)

        for misspelled_word in misspelled.copy():
            if(misspelled_word in config.parts["COMP_NAMES"]):
                misspelled.remove(misspelled_word)
            else:
                score = process.extract(misspelled_word, config.parts["COMP_NAMES"], limit=1)
                if(len(score) > 0 and score[0][1] > config.constants["threshold"]):
                    misspelled.remove(misspelled_word)

        is_question_fixed = False
        words = question
        for word in misspelled:
            # Get the one `most likely` answer
            if(word != self.spell.correction(word)): 
                is_question_fixed = True
                words = [self.spell.correction(word) if old_word==word else old_word for old_word in words.copy()]

        for index, word in enumerate(words):
            if(word in config.parts["COMP_NAMES"]):
                continue
            else:
                score = process.extract(word, config.parts["COMP_NAMES"], limit=1)
                if(len(score) > 0 and score[0][1] > config.constants["threshold"]):
                    words[index] = score[0][0]

        # convert word list to string
        fixed_question = ' '.join(words)

        # replace double spaces with one space
        fixed_question = fixed_question.replace('  ', ' ')

        return fixed_question, is_question_fixed

    def fixed_question(self, question):
        question = self.math_symbol_converter(question)
        question, is_question_fixed = self.misspell_corrector(question)
        return question, is_question_fixed