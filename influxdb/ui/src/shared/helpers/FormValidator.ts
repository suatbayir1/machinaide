export const handleValidation = (value: string): string | null => {
    if (value ? value.trim() === '' : true) {
        return 'This field cannot be empty'
    }

    if (value.length >= 51) {
        return 'Must be 50 characters or less'
    }
    return null
}