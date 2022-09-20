class Validator:
    """
    This class controls the parameters contained in the requests sent to the API
    """

    def check_request_params(self, payload, required_keys):
        confirm = True
        missed_keys = ""

        if not payload:
            return f"{','.join(required_keys)} cannot be empty", False

        for key in required_keys:
            if key not in payload or str(payload[key]).strip() == "":
                confirm = False
                missed_keys += f"{key}, "
        
        return f"{missed_keys[:-2]} cannot be empty", confirm
    
    @staticmethod
    def influx_query_validate(params):
        function_list = ["mean", "median", "last", "count", "mode", "sum", "min", "max"]
        period_list = ["s", "m", "h", "d"]

        if params["function"] not in function_list:
            return f"function must be one of {function_list}", False

        if params["period"][-1:] not in period_list:
            return f"period must be in the format {period_list}", False

        return "", True