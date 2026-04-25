import { Injectable, signal, computed } from '@angular/core';

/**
 * Browser event fired when the app meets the installability criteria.
 * Not in lib.dom yet, so we declare a minimal type.
 */
interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

/**
 * Globals stashed by the early-capture script in index.html.
 * That script captures `beforeinstallprompt` BEFORE Angular bootstraps so we don't miss it.
 */
declare global {
    interface Window {
        __pwaDeferredPrompt: BeforeInstallPromptEvent | null;
    }
}

@Injectable({ providedIn: 'root' })
export class PwaInstallService {
    private deferredPrompt = signal<BeforeInstallPromptEvent | null>(
        // Pick up any prompt that was captured before Angular booted
        (typeof window !== 'undefined' && window.__pwaDeferredPrompt) || null
    );
    private installed = signal(this.detectStandalone());

    /** True when the browser fired beforeinstallprompt and we can show the native prompt. */
    readonly canInstall = computed(() => !!this.deferredPrompt() && !this.installed());

    /** True when running as an installed PWA (standalone display mode). */
    readonly isInstalled = computed(() => this.installed());

    /** True for iOS Safari (which doesn't fire beforeinstallprompt — needs manual instructions). */
    readonly isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);

    /** True for iOS browsers other than Safari (Chrome/Firefox on iOS can't install at all). */
    readonly isIosSafari = this.isIos && /Safari/.test(navigator.userAgent) && !/CriOS|FxiOS|EdgiOS/.test(navigator.userAgent);

    /**
     * Show the install button whenever the app is NOT already running as an installed PWA.
     * The click handler is responsible for either triggering the native prompt or showing
     * a helpful message if install isn't available yet (e.g. dev mode, Firefox, etc.).
     */
    readonly showInstallButton = computed(() => !this.installed());

    constructor() {
        // Direct listener (in case the event fires AFTER Angular is up — covers late triggers).
        window.addEventListener('beforeinstallprompt', (e: Event) => {
            e.preventDefault();
            this.deferredPrompt.set(e as BeforeInstallPromptEvent);
            window.__pwaDeferredPrompt = e as BeforeInstallPromptEvent;
        });

        // Custom event from the early-capture script in index.html (covers events fired
        // before Angular bootstrapped but after the page loaded).
        window.addEventListener('pwa-install-available', () => {
            if (window.__pwaDeferredPrompt) {
                this.deferredPrompt.set(window.__pwaDeferredPrompt);
            }
        });

        window.addEventListener('appinstalled', () => {
            this.deferredPrompt.set(null);
            window.__pwaDeferredPrompt = null;
            this.installed.set(true);
        });

        window.addEventListener('pwa-installed', () => {
            this.deferredPrompt.set(null);
            this.installed.set(true);
        });
    }

    /**
     * Trigger the native install prompt.
     * Returns the user's choice, or null if no prompt is available (e.g. iOS).
     */
    async promptInstall(): Promise<'accepted' | 'dismissed' | null> {
        const prompt = this.deferredPrompt();
        if (!prompt) return null;

        await prompt.prompt();
        const choice = await prompt.userChoice;
        this.deferredPrompt.set(null);
        window.__pwaDeferredPrompt = null;
        return choice.outcome;
    }

    private detectStandalone(): boolean {
        return (
            window.matchMedia('(display-mode: standalone)').matches ||
            // iOS Safari uses the legacy `navigator.standalone` flag
            (navigator as Navigator & { standalone?: boolean }).standalone === true
        );
    }
}
