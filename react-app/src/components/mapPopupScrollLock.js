export function lockPageScroll() {
    const html = document.documentElement;
    const body = document.body;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    const previous = {
        htmlOverflow: html.style.overflow,
        bodyOverflow: body.style.overflow,
        bodyPosition: body.style.position,
        bodyTop: body.style.top,
        bodyLeft: body.style.left,
        bodyRight: body.style.right,
        bodyWidth: body.style.width,
    };

    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = `-${scrollX}px`;
    body.style.right = '0';
    body.style.width = '100%';

    return function unlockPageScroll() {
        html.style.overflow = previous.htmlOverflow;
        body.style.overflow = previous.bodyOverflow;
        body.style.position = previous.bodyPosition;
        body.style.top = previous.bodyTop;
        body.style.left = previous.bodyLeft;
        body.style.right = previous.bodyRight;
        body.style.width = previous.bodyWidth;
        window.scrollTo(scrollX, scrollY);
    };
}
