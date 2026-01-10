from .models import Notification

def send_notification(user, title, message, type='info', related_link=None):
    """
    Sends notification to user.
    """
    return Notification.objects.create(
        recipient=user,
        title=title,
        message=message,
        type=type,
        related_link=related_link
    )
