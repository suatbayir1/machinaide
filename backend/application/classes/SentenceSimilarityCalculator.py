import spacy
import torch
from nltk.tokenize import word_tokenize
from sentence_transformers import SentenceTransformer, util

class SentenceSimilarityCalculator:
    """
    This class is an NLP class developed to calculate the similarity between the question asked by the user 
    and the questions asked before in the database and includes methods used in the literature

    """
    
    def __init__(self):
        self.nlp = spacy.load('en_core_web_lg')
        self.embedder = SentenceTransformer('all-MiniLM-L6-v2')

    def calculate_jaccard_similarity(self, question, questions):
        """
        This method calculates the similarity between the question sent as a parameter and the previously
        asked questions in the database using jaccard similarity formula and returns the similarity ratio
        associated with the questions as a list.

        @param str question:  The question sending by UI
        @param list questions: List of previously asked questions in the database
        """
        similarity_table = []

        for Y in corpus:
            intersection = set(X).intersection(set(Y))
            union = set(X).union(set(Y))
            jaccard_similarity = len(intersection) / len(union)
            similarity_table.append({"question": Y, "score": jaccard_similarity})

        similarity_table = sorted(similarity_table, key = lambda x: x['score'], reverse = True)

        return similarity_table[:5]

    def calculate_cosine_similarity(self, question, questions):
        """
        This method calculates the similarity between the question sent as a parameter and the previously
        asked questions in the database using cosine similarity and returns the similarity ratio
        associated with the questions as a list.

        @param str question:  The question sending by UI
        @param list questions: List of previously asked questions in the database
        """

        X_list = word_tokenize(question.lower()) 

        similarity_table = []
        
        for Y in questions: 
            Y_list = word_tokenize(Y.lower())
            
            l1 =[];l2 =[]
            
            X_set = {w for w in X_list} 
            Y_set = {w for w in Y_list}
            
            rvector = X_set.union(Y_set) 
            for w in rvector:
                if w in X_set: l1.append(1)
                else: l1.append(0)
                if w in Y_set: l2.append(1)
                else: l2.append(0)
            c = 0

            for i in range(len(rvector)):
                    c+= l1[i]*l2[i]

            cosine_similarity = c / float((sum(l1) * sum (l2)) ** 0.5)

            similarity_table.append({"question": Y, "score": cosine_similarity})

        similarity_table = sorted(similarity_table, key = lambda x: x['score'], reverse = True)

        return similarity_table[:5]

    def calculate_similarity_with_spacy(self, question, questions):
        """
        This method calculates the similarity between the question sent as a parameter and the previously
        asked questions in the database using spacy similarty methods and returns the similarity ratio
        associated with the questions as a list.

        @param str question:  The question sending by UI
        @param list questions: List of previously asked questions in the database
        """
        similarity_table = []

        for Y in questions:
            Y = self.nlp(Y)

            X = self.nlp(' '.join([str(t) for t in question if not t.is_stop]))
            Y = self.nlp(' '.join([str(t) for t in Y if not t.is_stop]))

            score = X.similarity(Y)
            similarity_table.append({"question": question, "score": score})

        similarity_table = sorted(similarity_table, key = lambda x: x['score'], reverse = True)

        return similarity_table[:5]

    def sentence_transformer_semantic_search(self, question, questions):
        """
        This method calculates the similarity between the question sent as a parameter and the previously
        asked questions in the database using sentence transformer for semantic search method and returns 
        the similarity ratio associated with the questions as a list.

        @param str question:  The question sending by UI
        @param list questions: List of previously asked questions in the database
        """
        corpus_embeddings = self.embedder.encode(questions, convert_to_tensor = True)

        # Find the closest 5 sentences of the corpus for each query sentence based on cosine similarity
        top_k = min(5, len(questions))

        query_embedding = self.embedder.encode(question, convert_to_tensor = True)

        # Cosine similarity
        cos_scores = util.cos_sim(query_embedding, corpus_embeddings)[0]

        # Find the highest 5 scores
        top_results = torch.topk(cos_scores, k = top_k)

        similarity_table = []

        for score, idx in zip(top_results[0], top_results[1]):
            similarity_table.append({"question": questions[idx], "score": score.item()})

        similarity_table = sorted(similarity_table, key = lambda x: x['score'], reverse = True)

        return similarity_table
