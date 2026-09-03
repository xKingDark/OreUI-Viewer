// @ts-check
const { PlayerMessagingServiceFacetStatus } = require("@ore-ui-types/enums");

module.exports = /** @type {() => FacetTypeMap["vanilla.playermessagingservice"]} */ () => ({
    data: {
        messageCount: 4,
        messages: [
            {
                id: "0",
                template: "ImageText",
                surface: "LoginAnnouncement",
                additionalProperties: [
                    { key: "header", value: "Test" },
                    { key: "body", value: "Hello World!" },
                ],
                header: "Test",
                body: "Hello World!",
                gamedrop: null,
                instanceId: "",
                style: 0,
                subtitle: "",
                images: [
                    {
                        id: "Primary",
                        isLoaded: true,
                        url: "/hbui/assets/welcome_graphic-edbb3.png",
                        nonAnimatedUrl: "/hbui/assets/welcome_graphic-a7b874bb72ee6c080154.png",
                        animatedUrl: "",
                        imageSize: { width: 512, height: 256 },
                    },
                ],
                buttons: [
                    {
                        id: "Dismiss",
                        text: "",
                        link: "",
                        description: "",
                        action: /** @type {number} */ (/** @type {unknown} */ ("dismiss")),
                        reportClick() {
                            console.log("[EngineWrapper/PlayerMessagingServiceFacet] reportClick()");
                            return null;
                        },
                        openExternalLink() {
                            console.log("[EngineWrapper/PlayerMessagingServiceFacet] openExternalLink()");
                            return null;
                        },
                        additionalProperties: [],
                    },
                ],
            },
            {
                id: "1",
                template: "HeroImageCTA",
                surface: "LoginAnnouncement",
                additionalProperties: [
                    { key: "header", value: "Test" },
                    { key: "body", value: "Hello World!" },
                ],
                header: "Test",
                body: "Hello World!",
                gamedrop: null,
                instanceId: "",
                style: 0,
                subtitle: "",
                images: [
                    {
                        id: "Primary",
                        isLoaded: true,
                        url: "/hbui/assets/welcome_graphic-edbb3.png",
                        nonAnimatedUrl: "/hbui/assets/welcome_graphic-a7b874bb72ee6c080154.png",
                        animatedUrl: "",
                        imageSize: { width: 512, height: 256 },
                    },
                ],
                buttons: [
                    {
                        id: "Dismiss",
                        text: "",
                        link: "",
                        description: "",
                        action: /** @type {number} */ (/** @type {unknown} */ ("dismiss")),
                        reportClick() {
                            console.log("[EngineWrapper/PlayerMessagingServiceFacet] reportClick()");
                            return null;
                        },
                        openExternalLink() {
                            console.log("[EngineWrapper/PlayerMessagingServiceFacet] openExternalLink()");
                            return null;
                        },
                        additionalProperties: [],
                    },
                    {
                        id: "CallToAction",
                        text: "",
                        link: "",
                        description: "",
                        action: /** @type {number} */ (/** @type {unknown} */ ("productId")),
                        reportClick() {
                            console.log("[EngineWrapper/PlayerMessagingServiceFacet] reportClick()");
                            return null;
                        },
                        openExternalLink() {
                            console.log("[EngineWrapper/PlayerMessagingServiceFacet] openExternalLink()");
                            return null;
                        },
                        additionalProperties: [],
                    },
                ],
            },
            {
                id: "2",
                template: "ImageThumbnailCTA",
                surface: "LoginAnnouncement",
                additionalProperties: [
                    { key: "header", value: "Test" },
                    { key: "body", value: "Hello World!" },
                ],
                header: "Test",
                body: "Hello World!",
                gamedrop: null,
                instanceId: "",
                style: 0,
                subtitle: "",
                images: [
                    {
                        id: "Primary",
                        isLoaded: true,
                        url: "/hbui/assets/welcome_graphic-edbb3.png",
                        nonAnimatedUrl: "/hbui/assets/welcome_graphic-a7b874bb72ee6c080154.png",
                        animatedUrl: "",
                        imageSize: { width: 512, height: 256 },
                    },
                    {
                        id: "Secondary",
                        isLoaded: true,
                        url: "/hbui/assets/welcome_graphic-edbb3.png",
                        nonAnimatedUrl: "/hbui/assets/welcome_graphic-a7b874bb72ee6c080154.png",
                        animatedUrl: "",
                        imageSize: { width: 512, height: 256 },
                    },
                ],
                buttons: [
                    {
                        id: "CallToAction",
                        text: "",
                        reportClick() {
                            console.log("[EngineWrapper/PlayerMessagingServiceFacet] reportClick()");
                            return null;
                        },
                        openExternalLink() {
                            console.log("[EngineWrapper/PlayerMessagingServiceFacet] openExternalLink()");
                            return null;
                        },
                        action: 0,
                        description: "",
                        link: "",
                    },
                ],
            },
            {
                style: 0,
                gamedrop: null,
                buttons: [
                    {
                        action: 2,
                        link: "/marketplace?productId=61c7a786-d7ad-49e0-a710-817121cd9795&origin=PlayerMessaging",
                        description: "",
                        text: "Available Now",
                        id: "CallToAction",
                        openExternalLink() {
                            console.log("[EngineWrapper/PlayerMessagingServiceFacet] openExternalLink()");
                            return null;
                        },
                    },
                    {
                        action: 0,
                        link: "",
                        description: "",
                        text: "Continue",
                        id: "Dismiss",
                        openExternalLink() {
                            console.log("[EngineWrapper/PlayerMessagingServiceFacet] openExternalLink()");
                            return null;
                        },
                    },
                ],
                images: [
                    {
                        isLoaded: true,
                        imageSize: null,
                        nonAnimatedUrl: "id://813",
                        animatedUrl: "id://813",
                        id: "Primary",
                    },
                ],
                body: "Level up your Minecraft worlds with Actions & Stuff! Enjoy custom player and mob animations, 3D item models, retextured armor, visual effects, and more. The latest 1.5 update adds 60 new blocks, expressions, and new animations for happy ghasts, ghastlings, baby enderman, and so much more! You can also play with this pack for free with Marketplace Pass!",
                subtitle: "",
                header: "Actions and Stuff 1.5",
                template: "HeroImageCTA",
                surface: "MarketplaceAnnouncement",
                instanceId: "a0a89a32-2133-4968-8a20-90a21792d2c7",
                id: "a0a89a32-2133-4968-8a20-90a21792d2c7",
            },
        ],
    },
    status: PlayerMessagingServiceFacetStatus.LOADED,
    reportClick: () => console.log("[EngineWrapper/PlayerMessagingServiceFacet] reportClick.bind()"),
    reportDismiss: () => console.log("[EngineWrapper/PlayerMessagingServiceFacet] reportDismiss.bind()"),
});
