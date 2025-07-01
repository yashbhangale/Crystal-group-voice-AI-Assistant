interface KnowledgeItem {
  keywords: string[];
  response: string;
  category: string;
}

class KnowledgeBaseService {
  private knowledgeBase: KnowledgeItem[] = [
    // Company Overview - Multiple variations
    {
      keywords: ['what is crystal group', 'about crystal group', 'tell me about crystal'],
      response: 'Crystal Group is a diversified Indian business established in 1962, specializing in cold chain logistics and real estate development across multiple states.',
      category: 'company'
    },
    {
      keywords: ['crystal group company', 'who is crystal group'],
      response: 'Founded in 1962 by Murari Lal Agarwal, Crystal Group is a leading Indian company with 62 years of experience in cold chain logistics and real estate.',
      category: 'company'
    },
    {
      keywords: ['crystal business', 'what does crystal do'],
      response: 'Crystal Group operates in two main sectors: cold chain logistics with temperature-controlled solutions, and real estate development in Gujarat.',
      category: 'company'
    },
    
    // Cold Chain & Logistics - Multiple variations
    {
      keywords: ['cold chain logistics', 'tell me about cold chain'],
      response: 'Crystal Group pioneered cold chain logistics in India since 1962, offering refrigerated containers and warehousing with precise temperature control from -25°C to +25°C.',
      category: 'logistics'
    },
    {
      keywords: ['refrigerated containers', 'reefers', 'cold storage'],
      response: 'We provide portable refrigerated containers and cold storage solutions maintaining exact temperatures for pharmaceuticals, food, and floriculture industries.',
      category: 'logistics'
    },
    {
      keywords: ['logistics services', 'supply chain'],
      response: 'Crystal Group offers end-to-end cold chain solutions including refrigerated transport, warehousing, and real-time monitoring for your supply chain.',
      category: 'logistics'
    },
    
    // Warehousing
    {
      keywords: ['warehouse', 'warehousing', 'storage', 'kolkata', 'bhubaneswar'],
      response: 'Crystal Group operates modern warehousing facilities in Kolkata and Bhubaneswar with mobile pallet racking, advanced WMS software, and precise temperature control systems.',
      category: 'warehousing'
    },
    
    // Real Estate
    {
      keywords: ['real estate', 'property', 'development', 'gujarat', 'ahmedabad'],
      response: 'Crystal Group\'s real estate division, established in 1990 in Gujarat, develops commercial, residential, retail properties, shopping malls, and industrial parks.',
      category: 'real_estate'
    },
    
    // Services
    {
      keywords: ['services', 'what do you do', 'offerings'],
      response: 'Crystal Group provides refrigerated containers, warehousing, dry containers, ISO tanks, transportation services, and comprehensive cold chain solutions.',
      category: 'services'
    },
    
    // Mission & Vision
    {
      keywords: ['mission', 'vision', 'values'],
      response: 'Our mission is preserving temperature-sensitive goods with care and dedication. Our vision is becoming the most trusted partner in cold chain logistics.',
      category: 'values'
    },
    
    // Experience & History
    {
      keywords: ['history', 'experience', 'years', 'founded', 'established'],
      response: 'Founded in 1962 by Murari Lal Agarwal in Kolkata, Crystal Group brings over 62 years of trusted experience in cold chain logistics.',
      category: 'history'
    },
    
    // Industries Served
    {
      keywords: ['industries', 'pharmaceuticals', 'food', 'floriculture'],
      response: 'Crystal Group serves pharmaceuticals, food & beverage, floriculture, chemicals, and other temperature-sensitive industries with specialized solutions.',
      category: 'industries'
    },
    
    // Features & Benefits
    {
      keywords: ['features', 'benefits', 'why choose', 'advantage'],
      response: 'Crystal Group offers 24/7 support, real-time monitoring, secure solutions, customer-focused services, and 62 years of industry expertise.',
      category: 'benefits'
    },
    
    // Career & Work Culture
    {
      keywords: ['career', 'jobs', 'work', 'culture', 'join'],
      response: 'Crystal Group fosters a positive workplace valuing collaboration, innovation, and personal growth with opportunities for career advancement.',
      category: 'career'
    },
    
    // Contact & Location - Multiple variations
    {
      keywords: ['where is crystal group', 'crystal group location', 'address'],
      response: 'Crystal Group headquarters is in Kolkata since 1962, with warehousing facilities in Bhubaneswar and real estate operations in Gujarat.',
      category: 'contact'
    },
    {
      keywords: ['contact crystal group', 'how to contact'],
      response: 'You can reach Crystal Group at our Kolkata headquarters or through our facilities in Bhubaneswar and Gujarat for different services.',
      category: 'contact'
    },
    {
      keywords: ['offices', 'branches'],
      response: 'Crystal Group has its main office in Kolkata with operational facilities in Bhubaneswar for logistics and Gujarat for real estate development.',
      category: 'contact'
          },
      
      // Technology & Innovation
      {
        keywords: ['technology', 'monitoring', 'tracking', 'software'],
        response: 'Crystal Group uses advanced WMS software, real-time monitoring systems, and modern tracking technology for optimal cold chain management.',
        category: 'technology'
      },

      // Additional specific responses
      {
        keywords: ['how old', 'years old', 'age of company'],
        response: 'Crystal Group is 62 years old, established in 1962 by founder Murari Lal Agarwal in Kolkata.',
        category: 'history'
      },
      {
        keywords: ['temperature range', 'how cold', 'temperature control'],
        response: 'Our refrigerated solutions maintain precise temperatures from -25°C to +25°C, perfect for pharmaceuticals and perishable goods.',
        category: 'logistics'
      },
      {
        keywords: ['founder', 'who founded', 'murari lal'],
        response: 'Crystal Group was founded by Murari Lal Agarwal in 1962, starting our journey in cold chain logistics from Kolkata.',
        category: 'history'
      }
    ];

  searchKnowledge(query: string): string | null {
    const lowercaseQuery = query.toLowerCase();
    
    // Find matching knowledge items with scoring
    const matches = this.knowledgeBase.map(item => {
      const matchCount = item.keywords.filter(keyword => 
        lowercaseQuery.includes(keyword.toLowerCase())
      ).length;
      
      return {
        item,
        score: matchCount,
        relevance: this.calculateRelevance(lowercaseQuery, item.keywords)
      };
    }).filter(match => match.score > 0);
    
    if (matches.length === 0) {
      return null;
    }
    
    // Sort by relevance and score to get the best match
    matches.sort((a, b) => {
      if (a.relevance !== b.relevance) {
        return b.relevance - a.relevance;
      }
      return b.score - a.score;
    });
    
    return matches[0].item.response;
  }

  private calculateRelevance(query: string, keywords: string[]): number {
    let relevance = 0;
    
    // Higher relevance for exact keyword matches
    keywords.forEach(keyword => {
      if (query.includes(keyword.toLowerCase())) {
        relevance += keyword.split(' ').length; // Multi-word keywords get higher score
      }
    });
    
    // Boost relevance for question-specific terms
    if (query.includes('what is') || query.includes('tell me about')) {
      relevance += 2;
    }
    if (query.includes('where') || query.includes('location')) {
      relevance += 3;
    }
    if (query.includes('how') || query.includes('services')) {
      relevance += 3;
    }
    
    return relevance;
  }

  getAllCategories(): string[] {
    return [...new Set(this.knowledgeBase.map(item => item.category))];
  }

  getKnowledgeByCategory(category: string): KnowledgeItem[] {
    return this.knowledgeBase.filter(item => item.category === category);
  }

  // Check if the query is asking about Crystal Group specifically
  isCrystalGroupQuery(query: string): boolean {
    const crystalKeywords = [
      'crystal', 'cold chain', 'logistics', 'warehousing', 'real estate',
      'refrigerated', 'reefers', 'storage', 'gujarat', 'kolkata', 'bhubaneswar'
    ];
    
    const lowercaseQuery = query.toLowerCase();
    return crystalKeywords.some(keyword => 
      lowercaseQuery.includes(keyword.toLowerCase())
    );
  }

  // Get a comprehensive response about Crystal Group
  getCrystalGroupOverview(): string {
    return 'Crystal Group is a diversified Indian business established in 1962, specializing in cold chain logistics with facilities in Kolkata and Bhubaneswar, plus real estate development in Gujarat.';
  }
}

export const knowledgeBaseService = new KnowledgeBaseService(); 