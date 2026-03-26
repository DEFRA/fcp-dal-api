# DAL environments overview

The <abbr title="Data Access Layer">DAL</abbr> API provides data from upstream services (KITS/Version1 & Hitachi) to its consumers, e.g. <abbr title="Consolidated View">CV</abbr> service.
While CV and the DAL are hosted on <abbr title="Core Development Platform">CDP</abbr> with mirrored environments, the other systems they depend upon have very different structures; the diagram below shows the flow of data and how the various component services interact:

```mermaid
C4Context
  title DAL estate architecture overview

  Person(user, "CV User", "")

  Boundary(defra, "DEFRA (prod) tenant", "Entra ID") {
    System_Ext(ms-prod, "Microsoft OAuth services (used by all environments)")

    Boundary(prod, "Production environment") {
      Boundary(cdp-prod, "CDP Prod", "AWS DEFRA VPC") {
        System(cv-prod, "FCP-CV-Frontend", "Next.js React apps")
        System(dal-prod, "FCP-DAL-API", "Data Access Layer, GraphQL API")
      }

      System_Boundary(d365-prod, "Microsoft Dynamics") {
        System_Ext(crm-prod, "CRM")
        System_Ext(dataverse-prod, "Dataverse")
        System_Ext(hitachi-prod, "Hitachi Prod", "Payments service")
      }

      System_Boundary(crown-prod, "Crown Hosting Prod") {
        System_Ext(int-gw-prod, "Internal<br/>gateway")
        System_Ext(ext-gw-prod, "External<br/>gateway")
        System_Ext(kits-prod, "KITS Prod environment - PROD data")
      }

      Rel(cv-prod, dal-prod, "")
      Rel(cv-prod, dataverse-prod, "")
      Rel(crm-prod, cv-prod, "")
      Rel(crm-prod, dataverse-prod, "")
      Rel(dal-prod, int-gw-prod, "mTLS")
      Rel(dal-prod, ext-gw-prod, "mTLS")
      Rel(int-gw-prod, kits-prod, "")
      Rel(ext-gw-prod, kits-prod, "")
      Rel(dal-prod, hitachi-prod, "M$ OAuth")
    }

    Boundary(uat, "Pre-production environment (UAT)") {
      Boundary(cdp-et, "CDP Ext-Test", "AWS DEFRA VPC") {
        System(cv-et, "FCP-CV-Frontend", "Next.js React apps")
        System(dal-et, "FCP-DAL-API", "Data Access Layer, GraphQL API")
      }

      System_Boundary(d365-uat, "Microsoft Dynamics") {
        System_Ext(crm-uat, "CRM UAT")
        System_Ext(dataverse-uat, "Dataverse")
        System_Ext(hitachi-uat, "Hitachi UAT", "Payments service")
      }

      System_Boundary(crown-perf, "Crown Hosting Perf") {
        System_Ext(int-gw-perf, "Internal<br/>gateway")
        System_Ext(ext-gw-perf, "Internal<br/>gateway")
        System_Ext(kits-perf, "KITS 'Perf' environment - PROD data (snapshot)")
      }

      Rel(cv-et, dal-et, "")
      Rel(cv-et, dataverse-uat, "")
      Rel(crm-uat, cv-et, "")
      Rel(crm-uat, dataverse-uat, "")
      Rel(dal-et, int-gw-perf, "mTLS")
      Rel(dal-et, ext-gw-perf, "mTLS")
      Rel(int-gw-perf, kits-perf, "")
      Rel(ext-gw-perf, kits-perf, "")
      Rel(dal-et, hitachi-uat, "M$ OAuth")
    }

    Boundary(perf-test, "Perf-test environment") {
      Boundary(cdp-perf-test, "CDP Perf-Test", "AWS DEFRA VPC") {
        System(cv-perf-test, "FCP-CV-Frontend", "Next.js React apps")
        System(dal-perf-test, "FCP-DAL-API", "Data Access Layer, GraphQL API")

        System_Boundary(mock-perf-test, "FCP-DAL-Upstream-Mock") {
          System(hitachi-perf-test, "Hitachi (mocked)", "Payments service")
          System(kits-perf-test, "KITS (mocked)")
        }
      }

      Rel(cv-perf-test, dal-perf-test, "")
      Rel(dal-perf-test, kits-perf-test, "")
      Rel(dal-perf-test, hitachi-perf-test, "M$ OAuth")
    }
  }

  Boundary(defradev, "DEFRADEV (dev) tenant", "Entra ID") {
    System_Ext(ms-dev, "Microsoft OAuth services (used by Test ONLY, no auth on Dev)")

    Boundary(test, "Test environment") {
      Boundary(cdp-test, "CDP Test", "AWS DEFRA VPC") {
        System(cv-test, "FCP-CV-Frontend", "Next.js React apps")
        System(dal-test, "FCP-DAL-API", "Data Access Layer, GraphQL API")
      }

      System_Boundary(d365-fat, "Microsoft Dynamics") {
        System_Ext(crm-test, "CRM Dev-v9")
        System_Ext(dataverse-test, "Dataverse")
        System_Ext(hitachi-fat, "Hitachi FAT", "Payments service")
      }

      System_Boundary(crown-test, "Crown Hosting Upgrade") {
        System_Ext(int-gw-upgrade, "Internal<br/>gateway")
        System_Ext(ext-gw-upgrade, "External<br/>gateway")
        System_Ext(kits-upgrade, "KITS 'Upgrade' environment - jumbled/obfuscated data")
      }

      Rel(cv-test, dal-test, "")
      Rel(cv-test, dataverse-test, "")
      Rel(crm-test, cv-test, "")
      Rel(crm-test, dataverse-test, "")
      Rel(dal-test, int-gw-upgrade, "mTLS")
      Rel(dal-test, ext-gw-upgrade, "mTLS")
      Rel(int-gw-upgrade, kits-upgrade, "")
      Rel(ext-gw-upgrade, kits-upgrade, "")
      Rel(dal-test, hitachi-fat, "M$ OAuth")
    }

    Boundary(dev, "Dev environment") {
      Boundary(cdp-dev, "CDP Dev", "AWS DEFRA VPC") {
        System(cv-dev, "FCP-CV-Frontend", "Next.js React apps")
        System(dal-dev, "FCP-DAL-API", "Data Access Layer, GraphQL API")

        System_Boundary(mock-dev, "FCP-DAL-Upstream-Mock") {
          System(hitachi-dev, "Hitachi (mocked)", "Payments service")
          System(kits-dev, "KITS (mocked)")
        }
      }

      System_Boundary(d365-dev, "Microsoft Dynamics") {
        System_Ext(crm-dev, "CRM Dev-clone")
        System_Ext(dataverse-dev, "Dataverse")
      }

      Rel(cv-dev, dal-dev, "")
      Rel(cv-dev, dataverse-dev, "")
      Rel(crm-dev, cv-dev, "")
      Rel(crm-dev, dataverse-dev, "")
      Rel(dal-dev, kits-dev, "")
      Rel(dal-dev, hitachi-dev, "M$ OAuth")
    }
  }

  Rel(user, cv-prod, "")
  Rel(user, crm-prod, "")
```
